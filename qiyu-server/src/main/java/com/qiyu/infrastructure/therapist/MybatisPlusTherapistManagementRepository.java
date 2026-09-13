package com.qiyu.infrastructure.therapist;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.qiyu.application.therapist.TherapistManagementRepository;
import com.qiyu.infrastructure.persistence.entity.TherapistEntity;
import com.qiyu.infrastructure.persistence.entity.TherapistSkillEntity;
import com.qiyu.infrastructure.persistence.mapper.TherapistManagementMapper;
import com.qiyu.infrastructure.persistence.mapper.TherapistManagementProjection;
import com.qiyu.infrastructure.persistence.mapper.TherapistSkillMapper;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Repository;

import java.util.Arrays;
import java.util.List;
import java.util.Locale;
import java.util.Optional;

/** MyBatis-Plus implementation of therapist master-data persistence. */
@Repository
@ConditionalOnProperty(name = "qiyu.auth.persistence", havingValue = "true")
public class MybatisPlusTherapistManagementRepository implements TherapistManagementRepository {
    private final TherapistManagementMapper therapistMapper;
    private final TherapistSkillMapper skillMapper;

    public MybatisPlusTherapistManagementRepository(TherapistManagementMapper therapistMapper,
                                                     TherapistSkillMapper skillMapper) {
        this.therapistMapper = therapistMapper;
        this.skillMapper = skillMapper;
    }

    /** Resolves a stable API ID to an active therapist master. */
    @Override
    public Optional<TherapistMaster> find(String therapistId) {
        TherapistEntity entity = therapistMapper.selectOne(new LambdaQueryWrapper<TherapistEntity>()
                .eq(TherapistEntity::getTherapistCode, databaseCode(therapistId)).last("FOR UPDATE"));
        return Optional.ofNullable(entity).map(this::master);
    }

    /** Checks active therapist-code uniqueness through MyBatis-Plus. */
    @Override
    public boolean codeExists(String code) {
        return therapistMapper.selectCount(new LambdaQueryWrapper<TherapistEntity>()
                .eq(TherapistEntity::getTherapistCode, code)) > 0;
    }

    /** Resolves an enabled store from its public ID. */
    @Override
    public Optional<Long> resolveStoreDatabaseId(String storeId) {
        return Optional.ofNullable(therapistMapper.activeStoreId(storeCode(storeId)));
    }

    /** Inserts or updates only therapist master fields; skills are replaced by the application transaction. */
    @Override
    public TherapistMaster save(TherapistMaster value) {
        TherapistEntity entity = entity(value);
        if (entity.getId() == null) therapistMapper.insert(entity); else therapistMapper.updateById(entity);
        return master(entity);
    }

    /** Logically replaces ordered skill rows inside the caller's transaction. */
    @Override
    public void replaceSkills(long therapistDatabaseId, List<String> skills) {
        skillMapper.delete(new LambdaQueryWrapper<TherapistSkillEntity>()
                .eq(TherapistSkillEntity::getTherapistId, therapistDatabaseId));
        for (int index = 0; index < skills.size(); index++) {
            TherapistSkillEntity skill = new TherapistSkillEntity();
            skill.setTherapistId(therapistDatabaseId);
            skill.setSkillName(skills.get(index));
            skill.setSortOrder(index);
            skillMapper.insert(skill);
        }
    }

    /** Counts every non-terminal appointment before deletion. */
    @Override
    public long unfinishedBookingCount(long therapistDatabaseId) {
        return therapistMapper.unfinishedBookingCount(therapistDatabaseId);
    }

    /** Reloads the mutation response using the same labels and live workload semantics as administration reads. */
    @Override
    public TherapistProfile loadProfile(long therapistDatabaseId) {
        TherapistManagementProjection row = therapistMapper.profile(therapistDatabaseId);
        if (row == null) throw new IllegalStateException("技师保存成功但读取模型尚未同步");
        List<String> skills = row.skills() == null || row.skills().isBlank() ? List.of()
                : Arrays.stream(row.skills().split(",")).map(String::trim).filter(value -> !value.isEmpty()).toList();
        return new TherapistProfile(row.id(), row.name(), row.store(), row.level(), skills,
                row.status(), row.rating(), row.todayBookings(), row.code(), row.storeId(), row.mobile(),
                row.specifyFee(), row.enabled());
    }

    /** Logically deletes skills and therapist master while preserving booking history. */
    @Override
    public void delete(long therapistDatabaseId) {
        skillMapper.delete(new LambdaQueryWrapper<TherapistSkillEntity>()
                .eq(TherapistSkillEntity::getTherapistId, therapistDatabaseId));
        therapistMapper.deleteById(therapistDatabaseId);
    }

    private TherapistMaster master(TherapistEntity entity) {
        String code = therapistMapper.storeCode(entity.getStoreId());
        if (code == null) throw new IllegalStateException("技师关联门店不存在");
        return new TherapistMaster(entity.getId(), apiTherapistId(entity.getTherapistCode()),
                entity.getTherapistCode(), entity.getStoreId(), apiStoreId(code), entity.getTherapistName(),
                entity.getLevelName(), entity.getRating(), entity.getSpecifyFeeAmount(), entity.getStatus(),
                entity.getSortOrder() == null ? 0 : entity.getSortOrder(), Integer.valueOf(1).equals(entity.getEnabled()));
    }

    private static TherapistEntity entity(TherapistMaster value) {
        TherapistEntity entity = new TherapistEntity();
        entity.setId(value.databaseId()); entity.setTherapistCode(value.code()); entity.setStoreId(value.storeDatabaseId());
        entity.setTherapistName(value.name()); entity.setLevelName(value.level()); entity.setRating(value.rating());
        entity.setSpecifyFeeAmount(value.specifyFee()); entity.setStatus(value.status()); entity.setSortOrder(value.sortOrder());
        entity.setEnabled(value.enabled() ? 1 : 0);
        return entity;
    }

    private static String databaseCode(String therapistId) {
        if (therapistId == null || !therapistId.startsWith("therapist-")) throw new IllegalArgumentException("技师编号格式不正确");
        return switch (therapistId) {
            case "therapist-anran" -> "TH_JA_ANRAN";
            case "therapist-yuanyuan" -> "TH_XH_YUANYUAN";
            case "therapist-lin" -> "TH_LJZ_LIN";
            default -> therapistId.substring("therapist-".length()).replace('-', '_').toUpperCase(Locale.ROOT);
        };
    }

    private static String apiTherapistId(String code) {
        return switch (code) {
            case "TH_JA_ANRAN" -> "therapist-anran";
            case "TH_XH_YUANYUAN" -> "therapist-yuanyuan";
            case "TH_LJZ_LIN" -> "therapist-lin";
            default -> "therapist-" + code.toLowerCase(Locale.ROOT).replace('_', '-');
        };
    }

    private static String storeCode(String storeId) { return storeId.replaceFirst("^store-", "").replace('-', '_').toUpperCase(Locale.ROOT); }
    private static String apiStoreId(String code) { return "store-" + code.toLowerCase(Locale.ROOT).replace('_', '-'); }
}
