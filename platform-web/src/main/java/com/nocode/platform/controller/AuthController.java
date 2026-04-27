package com.nocode.platform.controller;

import com.nocode.platform.dto.LoginRequest;
import com.nocode.platform.service.AuthService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * REST-контроллер аутентификации пользователей.
 *
 * <p>Предоставляет эндпоинты для регистрации, входа в систему,
 * выхода и получения информации о текущем пользователе.
 * Делегирует бизнес-логику в {@link AuthService}.</p>
 */
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    /**
     * Регистрация нового пользователя.
     *
     * @param loginRequest данные для регистрации (логин и пароль)
     * @return сообщение об успешной регистрации или ошибка
     */
    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody LoginRequest loginRequest) {
        try {
            authService.register(loginRequest);
            return ResponseEntity.ok(Map.of("message", "User registered successfully"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("message", e.getMessage()));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("message", e.getMessage()));
        }
    }

    /**
     * Вход в систему по логину и паролю.
     *
     * @param loginRequest данные для входа
     * @param request      HTTP-запрос (для создания сессии)
     * @param response     HTTP-ответ
     * @return сообщение об успешном входе или ошибка 401
     */
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest loginRequest, HttpServletRequest request, HttpServletResponse response) {
        try {
            authService.login(loginRequest, request, response);
            return ResponseEntity.ok().body("Login successful");
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid credentials");
        }
    }

    /**
     * Выход из системы — инвалидация текущей сессии.
     */
    @PostMapping("/logout")
    public ResponseEntity<?> logout(HttpServletRequest request) {
        authService.logout(request);
        return ResponseEntity.ok().body("Logged out");
    }

    /**
     * Получение имени текущего аутентифицированного пользователя.
     */
    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        return ResponseEntity.ok().body(authentication.getName());
    }
}
