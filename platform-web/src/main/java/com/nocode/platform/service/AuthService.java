package com.nocode.platform.service;

import com.nocode.platform.domain.PlatformUser;
import com.nocode.platform.dto.LoginRequest;
import com.nocode.platform.repository.UserRepository;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.stereotype.Service;

/**
 * Сервис бизнес-логики аутентификации и регистрации пользователей.
 *
 * <p>Инкапсулирует работу с Spring Security: создание пользователей,
 * аутентификацию, управление сессиями и выход из системы.</p>
 */
@Service
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final SecurityContextRepository securityContextRepository;

    public AuthService(AuthenticationManager authenticationManager,
                       UserRepository userRepository,
                       PasswordEncoder passwordEncoder) {
        this.authenticationManager = authenticationManager;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.securityContextRepository = new HttpSessionSecurityContextRepository();
    }

    /**
     * Регистрация нового пользователя.
     *
     * @param request данные для регистрации (логин и пароль)
     * @throws IllegalArgumentException если логин или пароль не указаны
     * @throws IllegalStateException    если имя пользователя уже занято
     */
    public void register(LoginRequest request) {
        if (request.getUsername() == null || request.getPassword() == null) {
            throw new IllegalArgumentException("Username and password required");
        }
        if (userRepository.findByUsername(request.getUsername()).isPresent()) {
            throw new IllegalStateException("Username is already taken");
        }

        PlatformUser newUser = new PlatformUser();
        newUser.setUsername(request.getUsername());
        newUser.setPassword(passwordEncoder.encode(request.getPassword()));
        newUser.setRole("USER");

        userRepository.save(newUser);
    }

    /**
     * Аутентификация пользователя по логину и паролю.
     *
     * @param request      данные для входа
     * @param httpRequest  HTTP-запрос (для создания сессии)
     * @param httpResponse HTTP-ответ
     * @throws org.springframework.security.core.AuthenticationException при неверных учётных данных
     */
    public void login(LoginRequest request, HttpServletRequest httpRequest, HttpServletResponse httpResponse) {
        UsernamePasswordAuthenticationToken authenticationToken =
                new UsernamePasswordAuthenticationToken(request.getUsername(), request.getPassword());

        Authentication authentication = authenticationManager.authenticate(authenticationToken);
        SecurityContext sc = SecurityContextHolder.createEmptyContext();
        sc.setAuthentication(authentication);
        SecurityContextHolder.setContext(sc);

        securityContextRepository.saveContext(sc, httpRequest, httpResponse);
    }

    /**
     * Выход из системы — инвалидация текущей сессии.
     *
     * @param request HTTP-запрос
     */
    public void logout(HttpServletRequest request) {
        SecurityContextHolder.clearContext();
        HttpSession session = request.getSession(false);
        if (session != null) {
            session.invalidate();
        }
    }
}
