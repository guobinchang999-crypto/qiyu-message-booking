"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolvePageError = exports.defaultActionStateCopy = exports.defaultPageStateCopy = exports.imagePlaceholderLabels = void 0;
exports.imagePlaceholderLabels = {
    brand: '栖',
    service: '愈',
    therapist: '疗'
};
exports.defaultPageStateCopy = {
    loadingTitle: '正在加载',
    loadingDescription: '请稍候',
    errorTitle: '加载失败',
    errorMessage: '网络异常，请检查后重试',
    retryText: '重新加载',
    emptyTitle: '暂无数据',
    emptyDescription: '可以稍后再来看看'
};
exports.defaultActionStateCopy = {
    submitErrorTitle: '提交失败',
    bookingSubmitErrorMessage: '未能提交预约，请重试',
    paymentRefreshErrorMessage: '费用更新失败，请重试',
    checkinErrorTitle: '签到失败',
    checkinErrorMessage: '未能完成签到，请重试',
    refreshCodeText: '刷新预约码',
    reviewSubmitErrorMessage: '评价未能提交，请重试'
};
const resolvePageError = (error, configuredMessage = '') => {
    // Backend business reasons win so users learn why an action failed; configured copy is the fallback.
    if (error instanceof Error && error.message)
        return error.message;
    if (configuredMessage)
        return configuredMessage;
    return exports.defaultPageStateCopy.errorMessage;
};
exports.resolvePageError = resolvePageError;
