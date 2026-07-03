package com.vevui.userservice.service;

import com.vevui.userservice.dto.AuthDto;
import com.vevui.userservice.entity.User;
import com.vevui.userservice.repository.UserRepository;
import com.vevui.userservice.security.JwtService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.data.domain.PageImpl;

@Slf4j
@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    @Transactional
    public AuthDto.AuthResponse register(AuthDto.RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("Email đã được sử dụng: " + request.getEmail());
        }
        if (request.getPhone() != null && userRepository.existsByPhone(request.getPhone())) {
            throw new IllegalArgumentException("Số điện thoại đã được sử dụng");
        }

        User user = User.builder()
                .fullName(request.getFullName())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .phone(request.getPhone())
                .role(User.Role.USER)
                .build();

        String refreshToken = jwtService.generateRefreshToken();
        user.setRefreshToken(refreshToken);

        User saved = userRepository.save(user);
        log.info("New user registered: {} ({})", saved.getEmail(), saved.getId());

        return buildAuthResponse(saved, refreshToken);
    }

    @Transactional
    public AuthDto.AuthResponse login(AuthDto.LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new IllegalArgumentException("Email hoặc mật khẩu không đúng"));

        if (!user.getEnabled()) {
            throw new IllegalArgumentException("Tài khoản đã bị khóa");
        }

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new IllegalArgumentException("Email hoặc mật khẩu không đúng");
        }

        String refreshToken = jwtService.generateRefreshToken();
        user.setRefreshToken(refreshToken);
        userRepository.save(user);

        log.info("User logged in: {}", user.getEmail());
        return buildAuthResponse(user, refreshToken);
    }

    @Transactional
    public AuthDto.AuthResponse refreshToken(String refreshToken) {
        User user = userRepository.findByRefreshToken(refreshToken)
                .orElseThrow(() -> new IllegalArgumentException("Refresh token không hợp lệ hoặc đã hết hạn"));

        String newRefreshToken = jwtService.generateRefreshToken();
        user.setRefreshToken(newRefreshToken);
        userRepository.save(user);

        return buildAuthResponse(user, newRefreshToken);
    }

    public AuthDto.UserDto getUserById(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy user: " + id));
        return toUserDto(user);
    }

    @Transactional
    public AuthDto.UserDto updateProfile(Long id, AuthDto.UpdateProfileRequest request) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy user: " + id));

        if (request.getFullName() != null) user.setFullName(request.getFullName());
        if (request.getPhone() != null) {
            if (userRepository.existsByPhone(request.getPhone()) &&
                    !request.getPhone().equals(user.getPhone())) {
                throw new IllegalArgumentException("Số điện thoại đã được sử dụng");
            }
            user.setPhone(request.getPhone());
        }

        return toUserDto(userRepository.save(user));
    }

    public Page<AuthDto.UserDto> getAllUsers(Pageable pageable) {
        return userRepository.findAll(pageable).map(this::toUserDto);
    }

    // ── Admin: User Management ──

    @Transactional
    public AuthDto.UserDto updateUserStatus(Long id, String status) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy user: " + id));
        if ("BANNED".equals(status)) {
            user.setEnabled(false);
        } else {
            user.setEnabled(true);
        }
        return toUserDto(userRepository.save(user));
    }

    @Transactional
    public void deleteUser(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy user: " + id));
        user.setEnabled(false);
        userRepository.save(user);
        log.info("User {} soft-deleted (disabled)", id);
    }

    public Page<AuthDto.UserDto> searchUsers(String q, Pageable pageable) {
        // Get all users and filter (works for small admin datasets)
        Page<AuthDto.UserDto> all = userRepository.findAll(pageable).map(this::toUserDto);
        String lower = q.toLowerCase();
        List<AuthDto.UserDto> filtered = all.getContent().stream()
                .filter(dto -> (dto.getFullName() != null && dto.getFullName().toLowerCase().contains(lower))
                        || (dto.getEmail() != null && dto.getEmail().toLowerCase().contains(lower))
                        || (dto.getPhone() != null && dto.getPhone().contains(lower)))
                .collect(Collectors.toList());
        return new PageImpl<>(filtered, pageable, filtered.size());
    }

    private AuthDto.AuthResponse buildAuthResponse(User user, String refreshToken) {
        AuthDto.AuthResponse response = new AuthDto.AuthResponse();
        response.setId(user.getId());
        response.setFullName(user.getFullName());
        response.setEmail(user.getEmail());
        response.setPhone(user.getPhone());
        response.setRole(user.getRole().name());
        response.setAccessToken(jwtService.generateAccessToken(user));
        response.setRefreshToken(refreshToken);
        return response;
    }

    private AuthDto.UserDto toUserDto(User user) {
        AuthDto.UserDto dto = new AuthDto.UserDto();
        dto.setId(user.getId());
        dto.setFullName(user.getFullName());
        dto.setEmail(user.getEmail());
        dto.setPhone(user.getPhone());
        dto.setRole(user.getRole().name());
        if (user.getCreatedAt() != null) {
            dto.setCreatedAt(user.getCreatedAt().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME));
        }
        return dto;
    }
}
