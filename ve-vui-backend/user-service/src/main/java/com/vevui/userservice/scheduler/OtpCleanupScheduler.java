package com.vevui.userservice.scheduler;

import com.vevui.userservice.repository.OtpRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Slf4j
@Component
@RequiredArgsConstructor
public class OtpCleanupScheduler {

    private final OtpRepository otpRepository;

    /**
     * Mỗi 5 phút, xóa các OTP đã hết hạn hoặc đã dùng
     * Giữ cho bảng otps luôn gọn, không tích lũy dữ liệu cũ
     */
    @Scheduled(fixedRate = 300000)
    @Transactional
    public void cleanExpiredOtps() {
        int deleted = otpRepository.deleteByExpiresAtBeforeOrUsedTrue(LocalDateTime.now());
        if (deleted > 0) {
            log.info("Cleaned {} expired/used OTPs", deleted);
        }
    }
}
