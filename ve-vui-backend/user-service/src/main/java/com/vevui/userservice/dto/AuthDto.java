package com.vevui.userservice.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

public class AuthDto {

    @Data
    public static class RegisterRequest {
        @NotBlank(message = "Họ tên không được trống")
        @Size(min = 2, max = 100)
        private String fullName;

        @NotBlank(message = "Email không được trống")
        @Email(message = "Email không hợp lệ")
        private String email;

        @NotBlank(message = "Mật khẩu không được trống")
        @Size(min = 6, message = "Mật khẩu phải ít nhất 6 ký tự")
        private String password;

        @Pattern(regexp = "^(0[3|5|7|8|9])+([0-9]{8})$", message = "Số điện thoại không hợp lệ")
        private String phone;
    }

    @Data
    public static class LoginRequest {
        @NotBlank(message = "Email không được trống")
        @Email
        private String email;

        @NotBlank(message = "Mật khẩu không được trống")
        private String password;
    }

    @Data
    public static class RefreshRequest {
        @NotBlank
        private String refreshToken;
    }

    @Data
    public static class AuthResponse {
        private Long id;
        private String fullName;
        private String email;
        private String phone;
        private String role;
        private String accessToken;
        private String refreshToken;
        private String tokenType = "Bearer";
    }

    @Data
    public static class UserDto {
        private Long id;
        private String fullName;
        private String email;
        private String phone;
        private String role;
        private String createdAt;
    }

    @Data
    public static class UpdateProfileRequest {
        @Size(min = 2, max = 100)
        private String fullName;

        @Pattern(regexp = "^(0[3|5|7|8|9])+([0-9]{8})$")
        private String phone;
    }

    @Data
    public static class UpdateUserStatusRequest {
        private String status;
    }

    @Data
    public static class AdminCreateUserRequest {
        @NotBlank(message = "Họ tên không được trống")
        @Size(min = 2, max = 100)
        private String fullName;

        @NotBlank(message = "Email không được trống")
        @Email(message = "Email không hợp lệ")
        private String email;

        @NotBlank(message = "Mật khẩu không được trống")
        @Size(min = 6, message = "Mật khẩu phải ít nhất 6 ký tự")
        private String password;

        @Pattern(regexp = "^(0[3|5|7|8|9])+([0-9]{8})$")
        private String phone;

        private String role = "USER"; // USER or ADMIN
    }
}
