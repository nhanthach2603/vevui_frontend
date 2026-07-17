package com.vevui.userservice.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;

    public void sendOtpEmail(String to, String otpCode) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom("Vé Vui <noreply@vevui.vn>");
            helper.setTo(to);
            helper.setSubject("Mã xác minh đặt lại mật khẩu — Vé Vui");

            String htmlBody = """
                <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px;border:1px solid #e5e7eb;border-radius:12px;">
                  <h2 style="color:#2563eb;text-align:center;">Vé Vui</h2>
                  <p>Xin chào,</p>
                  <p>Bạn đã yêu cầu đặt lại mật khẩu. Mã xác minh của bạn là:</p>
                  <div style="text-align:center;margin:24px 0;">
                    <span style="display:inline-block;font-size:32px;font-weight:bold;letter-spacing:8px;color:#2563eb;background:#eff6ff;padding:12px 24px;border-radius:8px;">%s</span>
                  </div>
                  <p style="color:#6b7280;font-size:14px;">Mã này sẽ hết hạn sau <strong>5 phút</strong>. Nếu bạn không yêu cầu đặt lại mật khẩu, hãy bỏ qua email này.</p>
                  <hr style="border:none;border-top:1px solid #e5e7eb;margin:20px 0;"/>
                  <p style="color:#9ca3af;font-size:12px;text-align:center;">© 2026 Vé Vui — Nền tảng đặt vé xe trực tuyến</p>
                </div>
                """.formatted(otpCode);

            helper.setText(htmlBody, true);
            mailSender.send(message);
            log.info("OTP email sent to {} — code={}", to, otpCode);
        } catch (MessagingException e) {
            log.error("Failed to send OTP email to {}: {}", to, e.getMessage());
            throw new RuntimeException("Không thể gửi email xác minh: " + e.getMessage());
        }
    }
}
