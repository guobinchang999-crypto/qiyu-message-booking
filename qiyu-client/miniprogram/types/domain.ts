export type BookingStatus = 'PENDING_PAYMENT' | 'BOOKED' | 'CHECKED_IN' | 'WAITING_SERVICE' | 'IN_SERVICE' | 'PENDING_SETTLEMENT' | 'COMPLETED' | 'CANCELLED';
export type TimeSlotStatus = 'available' | 'limited' | 'full';
export type TimePeriodCode = 'MORNING' | 'AFTERNOON' | 'EVENING';
export type StoreBusinessStatusCode = 'OPEN' | 'CLOSED';
export type TherapistMode = 'auto' | 'specified';
export type BookingDraftFlow = 'create' | 'reschedule';
export type OrderAction = 'pay' | 'cancel' | 'reschedule' | 'contact' | 'show_code' | 'refresh_code' | 'rebook' | 'review' | 'view_detail';
export interface Store { id:string; name:string; distanceKm:number; rating:number; address:string; phone:string; latitude:number; longitude:number; businessStatusCode:StoreBusinessStatusCode; businessStatus:string; nextAvailableAt:string; isFrequent:boolean; facilities:string[]; highlights:string[]; memberBenefitText:string; coverImageUrl?:string; galleryImageUrl?:string; galleryImageUrls?:string[]; }
export interface ServiceItem { id:string; name:string; category:string; durationMinutes:number; price:number; memberPrice:number; salesCount:number; tags:string[]; description:string; processSteps:string[]; suitableFor:string; coverImageUrl?:string; bannerImageUrl?:string; }
export interface Therapist { id:string; name:string; storeId?:string; level:string; experienceYears:number; skills:string[]; rating:number; serviceCount:number; specifyFee:number; nextAvailableAt:string; availability:'available'|'busy'; avatarUrl?:string; }
export interface TimeSlot { id:string; startAt:string; period:TimePeriodCode; status:TimeSlotStatus; }
export interface PaymentSummary { itemAmount:number; therapistFee:number; discountAmount:number; balanceDeduction:number; depositDue:number; paidAmount:number; }
export interface BookingDraft { storeId:string; serviceId:string; appointmentDate:string; therapistMode:TherapistMode; therapistId?:string; slotId?:string; guestCount:number; contact:string; remark:string; benefitSelection:string; flow?:BookingDraftFlow; sourceBookingId?:string; }
export interface Booking { id:string; code:string; qrImageUrl?:string; status:BookingStatus; store:Store; service:ServiceItem; therapist:Therapist; scheduledAt:string; contact:string; payment:PaymentSummary; availableActions:OrderAction[]; }
export interface StoreReview { id:string; storeId:string; serviceId:string; userName:string; rating:number; content:string; tags:string[]; createdAt:string; }
export interface ReviewSubmitRequest { bookingId:string; therapistRating:number; environmentRating:number; serviceRating:number; tags:string[]; content:string; anonymous:boolean; imageUrls:string[]; }
