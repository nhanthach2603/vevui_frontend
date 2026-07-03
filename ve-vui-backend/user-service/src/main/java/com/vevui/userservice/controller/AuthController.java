package com.vevui.userservice.controller;

import com.vevui.userservice.dto.AuthDto;
import com.vevui.userservice.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@RequiredArgsConstructor
public class AuthController {

    private final UserService userService;

    // ── Auth endpoints ──

    @PostMapping("/api/auth/register")
    public ResponseEntity<AuthDto.AuthResponse> register(
            @Valid @RequestBody AuthDto.RegisterRequest request) {
        log.info("Register request for: {}", request.getEmail());
        return ResponseEntity.status(HttpStatus.CREATED).body(userService.register(request));
    }

    @PostMapping("/api/auth/login")
    public ResponseEntity<AuthDto.AuthResponse> login(
            @Valid @RequestBody AuthDto.LoginRequest request) {
        log.info("Login request for: {}", request.getEmail());
        return ResponseEntity.ok(userService.login(request));
    }

    @PostMapping("/api/auth/refresh")
    public ResponseEntity<AuthDto.AuthResponse> refresh(
            @Valid @RequestBody AuthDto.RefreshRequest request) {
        return ResponseEntity.ok(userService.refreshToken(request.getRefreshToken()));
    }

    @GetMapping("/api/auth/me")
    public ResponseEntity<AuthDto.UserDto> getCurrentUser(
            @RequestHeader("X-User-Id") Long userId) {
        return ResponseEntity.ok(userService.getUserById(userId));
    }

    // ── User endpoints ──

    @GetMapping("/api/users/{id}")
    public ResponseEntity<AuthDto.UserDto> getUserById(@PathVariable Long id) {
        return ResponseEntity.ok(userService.getUserById(id));
    }

    @PutMapping("/api/users/{id}")
    public ResponseEntity<AuthDto.UserDto> updateProfile(
            @PathVariable Long id,
            @Valid @RequestBody AuthDto.UpdateProfileRequest request,
            @RequestHeader("X-User-Id") String requesterId) {
        // Users can only update their own profile unless admin
        return ResponseEntity.ok(userService.updateProfile(id, request));
    }

    // ── Admin endpoints ──

    @GetMapping("/api/admin/users")
    public ResponseEntity<Page<AuthDto.UserDto>> getAllUsers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(userService.getAllUsers(PageRequest.of(page, size)));
    }

    @GetMapping("/api/admin/users/search")
    public ResponseEntity<List<AuthDto.UserDto>> searchUsers(
            @RequestParam String q) {
        return ResponseEntity.ok(userService.searchUsers(q));
    }

    @PostMapping("/api/admin/users")
    public ResponseEntity<AuthDto.UserDto> createUserByAdmin(
            @Valid @RequestBody AuthDto.AdminCreateUserRequest request) {
        log.info("Admin creating user: {}", request.getEmail());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(userService.createUserByAdmin(request));
    }

    @GetMapping("/api/admin/users/{id}")
    public ResponseEntity<AuthDto.UserDto> getUserByIdAdmin(@PathVariable Long id) {
        return ResponseEntity.ok(userService.getUserById(id));
    }

    @PutMapping("/api/admin/users/{id}/status")
    public ResponseEntity<AuthDto.UserDto> updateUserStatus(
            @PathVariable Long id,
            @RequestBody AuthDto.UpdateUserStatusRequest req) {
        return ResponseEntity.ok(userService.updateUserStatus(id, req.getStatus()));
    }

    @PutMapping("/api/admin/users/{id}/role")
    public ResponseEntity<AuthDto.UserDto> updateUserRole(
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {
        return ResponseEntity.ok(userService.updateUserRole(id, body.get("role")));
    }

    @DeleteMapping("/api/admin/users/{id}")
    public ResponseEntity<Map<String, String>> deleteUser(@PathVariable Long id) {
        userService.deleteUser(id);
        return ResponseEntity.ok(Map.of("message", "Tài khoản đã được vô hiệu hóa"));
    }

    // ── Global error handler ──

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, String>> handleBadRequest(IllegalArgumentException ex) {
        return ResponseEntity.badRequest()
                .body(Map.of("error", ex.getMessage()));
    }
}
