#!/usr/bin/env bash

# Deploy one qiyu-server container and restore the previous container if the
# replacement does not become healthy. All configuration is supplied through
# environment variables so the same script can be tested outside GitHub Actions.
set -Eeuo pipefail

readonly ROLLBACK_SUFFIX="rollback"
ENV_FILE=""
LAST_HEALTH_STATUS="not-started"
ROLLBACK_STATUS="Not required"

log() {
  printf '[deploy] %s\n' "$*"
}

error() {
  if [[ "${GITHUB_ACTIONS:-false}" == "true" ]]; then
    printf '::error::%s\n' "$*"
  else
    printf '[deploy] ERROR: %s\n' "$*" >&2
  fi
}

write_output() {
  local name="$1"
  local value="$2"
  if [[ -n "${GITHUB_OUTPUT:-}" ]]; then
    printf '%s=%s\n' "$name" "$value" >> "$GITHUB_OUTPUT"
  fi
}

require_variable() {
  local name="$1"
  if [[ -z "${!name:-}" ]]; then
    error "$name is required."
    exit 1
  fi
}

append_environment_variable() {
  local name="$1"
  local value="${!name:-}"
  if [[ "$value" == *$'\n'* || "$value" == *$'\r'* ]]; then
    error "$name must not contain newline characters."
    exit 1
  fi
  printf '%s=%s\n' "$name" "$value" >> "$ENV_FILE"
}

container_exists() {
  docker container inspect "$1" >/dev/null 2>&1
}

wait_for_healthy_container() {
  local container="$1"
  local timeout_seconds="$2"
  local deadline=$((SECONDS + timeout_seconds))
  local container_state
  local health_status

  while ((SECONDS < deadline)); do
    if ! container_exists "$container"; then
      LAST_HEALTH_STATUS="missing"
      return 1
    fi

    container_state="$(docker inspect --format '{{.State.Status}}' "$container")"
    health_status="$(docker inspect --format '{{if .State.Health}}{{.State.Health.Status}}{{else}}missing{{end}}' "$container")"
    LAST_HEALTH_STATUS="$health_status"

    case "$health_status" in
      healthy)
        return 0
        ;;
      unhealthy)
        return 1
        ;;
      missing)
        return 1
        ;;
    esac

    if [[ "$container_state" == "exited" || "$container_state" == "dead" ]]; then
      LAST_HEALTH_STATUS="$container_state"
      return 1
    fi

    sleep 5
  done

  LAST_HEALTH_STATUS="timeout"
  return 1
}

restore_previous_container() {
  local rollback_container="$1"

  if ! container_exists "$rollback_container"; then
    ROLLBACK_STATUS="Unavailable (first deployment)"
    return 0
  fi

  log "Restoring the previous container."
  docker rename "$rollback_container" "$CONTAINER_NAME"
  if ! docker start "$CONTAINER_NAME" >/dev/null; then
    ROLLBACK_STATUS="Failed to start previous container"
    return 1
  fi

  if wait_for_healthy_container "$CONTAINER_NAME" "$HEALTH_TIMEOUT_SECONDS"; then
    ROLLBACK_STATUS="Previous container restored"
    return 0
  fi

  ROLLBACK_STATUS="Previous container restored but health is $LAST_HEALTH_STATUS"
  return 1
}

fail_deployment() {
  local reason="$1"
  local rollback_container="$2"
  local failed_health_status="$LAST_HEALTH_STATUS"

  if container_exists "$CONTAINER_NAME"; then
    log "Recent application logs from the failed container:"
    docker logs --tail 200 "$CONTAINER_NAME" 2>&1 || true
    docker rm -f "$CONTAINER_NAME" >/dev/null 2>&1 || true
  fi

  restore_previous_container "$rollback_container" || true
  write_output "health_status" "$failed_health_status"
  write_output "rollback_status" "$ROLLBACK_STATUS"
  error "$reason Rollback status: $ROLLBACK_STATUS."
  exit 1
}

cleanup() {
  if [[ -n "$ENV_FILE" ]]; then
    rm -f "$ENV_FILE"
  fi
}
trap cleanup EXIT

for command_name in docker mktemp; do
  if ! command -v "$command_name" >/dev/null 2>&1; then
    error "$command_name is required on the self-hosted runner."
    exit 1
  fi
done

for variable_name in \
  IMAGE_REFERENCE \
  CONTAINER_NAME \
  CONTAINER_PORT \
  HOST_PORT \
  HEALTH_TIMEOUT_SECONDS \
  SPRING_PROFILE \
  QIYU_DB_URL \
  QIYU_DB_USERNAME \
  QIYU_DB_PASSWORD \
  SPRING_DATA_REDIS_HOST \
  SPRING_DATA_REDIS_PORT; do
  require_variable "$variable_name"
done

if [[ ! "$HOST_PORT" =~ ^[0-9]+$ || "$HOST_PORT" -lt 1 || "$HOST_PORT" -gt 65535 ]]; then
  error "HOST_PORT must be between 1 and 65535."
  exit 1
fi
if [[ ! "$CONTAINER_PORT" =~ ^[0-9]+$ || "$CONTAINER_PORT" -lt 1 || "$CONTAINER_PORT" -gt 65535 ]]; then
  error "CONTAINER_PORT must be between 1 and 65535."
  exit 1
fi
if [[ ! "$HEALTH_TIMEOUT_SECONDS" =~ ^[0-9]+$ || "$HEALTH_TIMEOUT_SECONDS" -lt 30 ]]; then
  error "HEALTH_TIMEOUT_SECONDS must be an integer of at least 30."
  exit 1
fi
for variable_name in QIYU_MINIO_ENABLED QIYU_MINIO_PUBLIC_READ QIYU_MINIO_SEED_ENABLED; do
  value="${!variable_name:-false}"
  if [[ "$value" != "true" && "$value" != "false" ]]; then
    error "$variable_name must be true or false."
    exit 1
  fi
done
if [[ "${QIYU_MINIO_ENABLED:-false}" == "true" ]]; then
  for variable_name in QIYU_MINIO_ENDPOINT QIYU_MINIO_ACCESS_KEY QIYU_MINIO_SECRET_KEY QIYU_MINIO_BUCKET; do
    require_variable "$variable_name"
  done
fi

readonly ROLLBACK_CONTAINER="${CONTAINER_NAME}-${ROLLBACK_SUFFIX}"
readonly TEMP_DIRECTORY="${RUNNER_TEMP:-/tmp}"
ENV_FILE="$(mktemp "${TEMP_DIRECTORY%/}/qiyu-server-env.XXXXXX")"
chmod 600 "$ENV_FILE"

# Map GitHub Environment settings to Spring Boot's standard environment names.
for variable_name in \
  SPRING_PROFILES_ACTIVE \
  JAVA_OPTS \
  QIYU_DB_URL \
  QIYU_DB_USERNAME \
  QIYU_DB_PASSWORD \
  SPRING_DATA_REDIS_HOST \
  SPRING_DATA_REDIS_PORT \
  SPRING_DATA_REDIS_PASSWORD \
  ADMIN_INITIAL_PASSWORD \
  QIYU_STORAGE_MINIO_ENABLED \
  QIYU_STORAGE_MINIO_ENDPOINT \
  QIYU_STORAGE_MINIO_ACCESS_KEY \
  QIYU_STORAGE_MINIO_SECRET_KEY \
  QIYU_STORAGE_MINIO_BUCKET \
  QIYU_STORAGE_MINIO_PUBLIC_BASE_URL \
  QIYU_STORAGE_MINIO_PUBLIC_READ \
  QIYU_STORAGE_MINIO_SEED_ENABLED; do
  case "$variable_name" in
    SPRING_PROFILES_ACTIVE) export SPRING_PROFILES_ACTIVE="$SPRING_PROFILE" ;;
    QIYU_STORAGE_MINIO_ENABLED) export QIYU_STORAGE_MINIO_ENABLED="${QIYU_MINIO_ENABLED:-false}" ;;
    QIYU_STORAGE_MINIO_ENDPOINT) export QIYU_STORAGE_MINIO_ENDPOINT="${QIYU_MINIO_ENDPOINT:-}" ;;
    QIYU_STORAGE_MINIO_ACCESS_KEY) export QIYU_STORAGE_MINIO_ACCESS_KEY="${QIYU_MINIO_ACCESS_KEY:-}" ;;
    QIYU_STORAGE_MINIO_SECRET_KEY) export QIYU_STORAGE_MINIO_SECRET_KEY="${QIYU_MINIO_SECRET_KEY:-}" ;;
    QIYU_STORAGE_MINIO_BUCKET) export QIYU_STORAGE_MINIO_BUCKET="${QIYU_MINIO_BUCKET:-}" ;;
    QIYU_STORAGE_MINIO_PUBLIC_BASE_URL) export QIYU_STORAGE_MINIO_PUBLIC_BASE_URL="${QIYU_MINIO_PUBLIC_BASE_URL:-}" ;;
    QIYU_STORAGE_MINIO_PUBLIC_READ) export QIYU_STORAGE_MINIO_PUBLIC_READ="${QIYU_MINIO_PUBLIC_READ:-false}" ;;
    QIYU_STORAGE_MINIO_SEED_ENABLED) export QIYU_STORAGE_MINIO_SEED_ENABLED="${QIYU_MINIO_SEED_ENABLED:-false}" ;;
  esac
  append_environment_variable "$variable_name"
done

log "Pulling $IMAGE_REFERENCE before changing the active container."
docker pull "$IMAGE_REFERENCE"

image_digest="$(docker image inspect --format '{{index .RepoDigests 0}}' "$IMAGE_REFERENCE" 2>/dev/null || true)"
if [[ -z "$image_digest" || "$image_digest" == "<no value>" ]]; then
  image_digest="$(docker image inspect --format '{{.Id}}' "$IMAGE_REFERENCE")"
fi
write_output "image_digest" "$image_digest"

if container_exists "$ROLLBACK_CONTAINER"; then
  docker rm -f "$ROLLBACK_CONTAINER" >/dev/null
fi

if container_exists "$CONTAINER_NAME"; then
  log "Preserving the current container for automatic rollback."
  if ! docker stop --time 30 "$CONTAINER_NAME" >/dev/null; then
    error "The current container could not be stopped; it has not been replaced."
    exit 1
  fi
  if ! docker rename "$CONTAINER_NAME" "$ROLLBACK_CONTAINER"; then
    docker start "$CONTAINER_NAME" >/dev/null 2>&1 || true
    error "The current container could not be preserved; it has been restarted."
    exit 1
  fi
fi

log "Starting the replacement container."
if ! docker run -d \
  --name "$CONTAINER_NAME" \
  --restart unless-stopped \
  --add-host host.docker.internal:host-gateway \
  --env-file "$ENV_FILE" \
  --label com.qiyu.service=qiyu-server \
  --label com.qiyu.deployed-by=github-actions \
  -p "${HOST_PORT}:${CONTAINER_PORT}" \
  "$IMAGE_REFERENCE" >/dev/null; then
  fail_deployment "The replacement container could not be started." "$ROLLBACK_CONTAINER"
fi

log "Waiting up to ${HEALTH_TIMEOUT_SECONDS}s for a healthy container."
if ! wait_for_healthy_container "$CONTAINER_NAME" "$HEALTH_TIMEOUT_SECONDS"; then
  fail_deployment "The replacement container health status is $LAST_HEALTH_STATUS." "$ROLLBACK_CONTAINER"
fi

if container_exists "$ROLLBACK_CONTAINER"; then
  if ! docker rm -f "$ROLLBACK_CONTAINER" >/dev/null; then
    log "Warning: the stopped rollback container could not be removed."
  fi
fi

write_output "health_status" "healthy"
write_output "rollback_status" "Not required"
log "Deployment completed successfully with image $image_digest."
