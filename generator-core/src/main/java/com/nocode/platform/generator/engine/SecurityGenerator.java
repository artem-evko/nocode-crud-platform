package com.nocode.platform.generator.engine;

import java.nio.charset.StandardCharsets;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;

/**
 * Генератор модуля безопасности (JWT-аутентификация) для сгенерированных проектов.
 *
 * <p>Создаёт полный набор классов: User, UserRepository, JwtUtil,
 * JwtAuthenticationFilter, SecurityConfig, UserDetailsServiceImpl
 * и AuthController с эндпоинтами /api/auth/login и /api/auth/register.</p>
 */
public class SecurityGenerator {

    /**
     * Генерация файлов модуля безопасности в ZIP-архив.
     *
     * @param zos         выходной ZIP-поток
     * @param rootPath    корневой путь внутри архива (backend/)
     * @param pkgPath     путь пакета в файловой системе (com/example/app)
     * @param basePackage базовый Java-пакет (com.example.app)
     */
    public void generate(ZipOutputStream zos, String rootPath, String pkgPath, String basePackage) throws Exception {
        String secPath = rootPath + "src/main/java/" + pkgPath + "/security/";

        putText(zos, secPath + "User.java", getUserCode(basePackage));
        putText(zos, secPath + "UserRepository.java", getUserRepositoryCode(basePackage));
        putText(zos, secPath + "JwtUtil.java", getJwtUtilCode(basePackage));
        putText(zos, secPath + "SecurityConfig.java", getSecurityConfigCode(basePackage));
        putText(zos, secPath + "UserDetailsServiceImpl.java", getUserDetailsServiceImplCode(basePackage));
        putText(zos, secPath + "AuthController.java", getAuthControllerCode(basePackage));
        putText(zos, secPath + "JwtAuthenticationFilter.java", getJwtAuthenticationFilterCode(basePackage));
    }

    private void putText(ZipOutputStream zos, String path, String content) throws Exception {
        ZipEntry entry = new ZipEntry(path);
        zos.putNextEntry(entry);
        zos.write(content.getBytes(StandardCharsets.UTF_8));
        zos.closeEntry();
    }

    private String getUserCode(String basePackage) {
        return "package " + basePackage + ".security;\n\n" +
               "import jakarta.persistence.*;\n" +
               "import org.springframework.security.core.GrantedAuthority;\n" +
               "import org.springframework.security.core.authority.SimpleGrantedAuthority;\n" +
               "import org.springframework.security.core.userdetails.UserDetails;\n" +
               "import java.util.Collection;\n" +
               "import java.util.List;\n\n" +
               "@Entity\n" +
               "@Table(name = \"users\")\n" +
               "public class User implements UserDetails {\n" +
               "    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;\n" +
               "    private String username;\n" +
               "    private String password;\n" +
               "    private String role;\n\n" +
               "    public Long getId() { return id; }\n" +
               "    public void setId(Long id) { this.id = id; }\n" +
               "    public String getUsername() { return username; }\n" +
               "    public void setUsername(String username) { this.username = username; }\n" +
               "    public String getPassword() { return password; }\n" +
               "    public void setPassword(String password) { this.password = password; }\n" +
               "    public String getRole() { return role; }\n" +
               "    public void setRole(String role) { this.role = role; }\n\n" +
               "    @Override public Collection<? extends GrantedAuthority> getAuthorities() { return List.of(new SimpleGrantedAuthority(role)); }\n" +
               "    @Override public boolean isAccountNonExpired() { return true; }\n" +
               "    @Override public boolean isAccountNonLocked() { return true; }\n" +
               "    @Override public boolean isCredentialsNonExpired() { return true; }\n" +
               "    @Override public boolean isEnabled() { return true; }\n" +
               "}\n";
    }

    private String getUserRepositoryCode(String basePackage) {
        return "package " + basePackage + ".security;\n\n" +
               "import org.springframework.data.jpa.repository.JpaRepository;\n" +
               "import java.util.Optional;\n\n" +
               "public interface UserRepository extends JpaRepository<User, Long> {\n" +
               "    Optional<User> findByUsername(String username);\n" +
               "}\n";
    }

    private String getJwtUtilCode(String basePackage) {
        return "package " + basePackage + ".security;\n\n" +
               "import io.jsonwebtoken.Claims;\n" +
               "import io.jsonwebtoken.Jwts;\n" +
               "import io.jsonwebtoken.security.Keys;\n" +
               "import org.springframework.security.core.userdetails.UserDetails;\n" +
               "import org.springframework.stereotype.Component;\n" +
               "import javax.crypto.SecretKey;\n" +
               "import java.util.Date;\n" +
               "import java.util.function.Function;\n\n" +
               "@Component\n" +
               "public class JwtUtil {\n" +
               "    private static final String SECRET_KEY = \"my-32-character-ultra-secure-and-ultra-long-secret\";\n" +
               "    private static final long EXPIRATION_TIME = 86400000;\n\n" +
               "    private SecretKey getSigningKey() {\n" +
               "        return Keys.hmacShaKeyFor(SECRET_KEY.getBytes());\n" +
               "    }\n\n" +
               "    public String extractUsername(String token) {\n" +
               "        return extractClaim(token, Claims::getSubject);\n" +
               "    }\n\n" +
               "    public <T> T extractClaim(String token, Function<Claims, T> claimsResolver) {\n" +
               "        final Claims claims = extractAllClaims(token);\n" +
               "        return claimsResolver.apply(claims);\n" +
               "    }\n\n" +
               "    private Claims extractAllClaims(String token) {\n" +
               "        return Jwts.parser().verifyWith(getSigningKey()).build().parseSignedClaims(token).getPayload();\n" +
               "    }\n\n" +
               "    public String generateToken(UserDetails userDetails) {\n" +
               "        return Jwts.builder()\n" +
               "                .subject(userDetails.getUsername())\n" +
               "                .issuedAt(new Date(System.currentTimeMillis()))\n" +
               "                .expiration(new Date(System.currentTimeMillis() + EXPIRATION_TIME))\n" +
               "                .signWith(getSigningKey())\n" +
               "                .compact();\n" +
               "    }\n\n" +
               "    public boolean isTokenValid(String token, UserDetails userDetails) {\n" +
               "        final String username = extractUsername(token);\n" +
               "        return (username.equals(userDetails.getUsername()) && !isTokenExpired(token));\n" +
               "    }\n\n" +
               "    private boolean isTokenExpired(String token) {\n" +
               "        return extractExpiration(token).before(new Date());\n" +
               "    }\n" +
               "    private Date extractExpiration(String token) {\n" +
               "        return extractClaim(token, Claims::getExpiration);\n" +
               "    }\n" +
               "}\n";
    }

    private String getJwtAuthenticationFilterCode(String basePackage) {
        return "package " + basePackage + ".security;\n\n" +
               "import jakarta.servlet.FilterChain;\n" +
               "import jakarta.servlet.ServletException;\n" +
               "import jakarta.servlet.http.HttpServletRequest;\n" +
               "import jakarta.servlet.http.HttpServletResponse;\n" +
               "import org.springframework.lang.NonNull;\n" +
               "import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;\n" +
               "import org.springframework.security.core.context.SecurityContextHolder;\n" +
               "import org.springframework.security.core.userdetails.UserDetails;\n" +
               "import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;\n" +
               "import org.springframework.stereotype.Component;\n" +
               "import org.springframework.web.filter.OncePerRequestFilter;\n" +
               "import java.io.IOException;\n\n" +
               "@Component\n" +
               "public class JwtAuthenticationFilter extends OncePerRequestFilter {\n" +
               "    private final JwtUtil jwtUtil;\n" +
               "    private final UserDetailsServiceImpl userDetailsService;\n\n" +
               "    public JwtAuthenticationFilter(JwtUtil jwtUtil, UserDetailsServiceImpl userDetailsService) {\n" +
               "        this.jwtUtil = jwtUtil;\n" +
               "        this.userDetailsService = userDetailsService;\n" +
               "    }\n\n" +
               "    @Override\n" +
               "    protected void doFilterInternal(@NonNull HttpServletRequest request, @NonNull HttpServletResponse response, @NonNull FilterChain filterChain) throws ServletException, IOException {\n" +
               "        final String authHeader = request.getHeader(\"Authorization\");\n" +
               "        final String jwt;\n" +
               "        final String username;\n" +
               "        if (authHeader == null || !authHeader.startsWith(\"Bearer \")) {\n" +
               "            filterChain.doFilter(request, response);\n" +
               "            return;\n" +
               "        }\n" +
               "        jwt = authHeader.substring(7);\n" +
               "        username = jwtUtil.extractUsername(jwt);\n" +
               "        if (username != null && SecurityContextHolder.getContext().getAuthentication() == null) {\n" +
               "            UserDetails userDetails = this.userDetailsService.loadUserByUsername(username);\n" +
               "            if (jwtUtil.isTokenValid(jwt, userDetails)) {\n" +
               "                UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());\n" +
               "                authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));\n" +
               "                SecurityContextHolder.getContext().setAuthentication(authToken);\n" +
               "            }\n" +
               "        }\n" +
               "        filterChain.doFilter(request, response);\n" +
               "    }\n" +
               "}\n";
    }

    private String getSecurityConfigCode(String basePackage) {
        return "package " + basePackage + ".security;\n\n" +
               "import org.springframework.context.annotation.Bean;\n" +
               "import org.springframework.context.annotation.Configuration;\n" +
               "import org.springframework.security.authentication.AuthenticationManager;\n" +
               "import org.springframework.security.authentication.AuthenticationProvider;\n" +
               "import org.springframework.security.authentication.dao.DaoAuthenticationProvider;\n" +
               "import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;\n" +
               "import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;\n" +
               "import org.springframework.security.config.annotation.web.builders.HttpSecurity;\n" +
               "import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;\n" +
               "import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;\n" +
               "import org.springframework.security.config.http.SessionCreationPolicy;\n" +
               "import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;\n" +
               "import org.springframework.security.crypto.password.PasswordEncoder;\n" +
               "import org.springframework.security.web.SecurityFilterChain;\n" +
               "import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;\n" +
               "import org.springframework.web.cors.CorsConfiguration;\n" +
               "import java.util.List;\n\n" +
               "@Configuration\n" +
               "@EnableWebSecurity\n" +
               "@EnableMethodSecurity\n" +
               "public class SecurityConfig {\n" +
               "    private final JwtAuthenticationFilter jwtAuthFilter;\n" +
               "    private final UserDetailsServiceImpl userDetailsService;\n\n" +
               "    public SecurityConfig(JwtAuthenticationFilter jwtAuthFilter, UserDetailsServiceImpl userDetailsService) {\n" +
               "        this.jwtAuthFilter = jwtAuthFilter;\n" +
               "        this.userDetailsService = userDetailsService;\n" +
               "    }\n\n" +
               "    @Bean\n" +
               "    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {\n" +
               "        http\n" +
               "            .cors(cors -> cors.configurationSource(request -> {\n" +
               "                var conf = new CorsConfiguration();\n" +
               "                conf.setAllowedOrigins(List.of(\"http://localhost:5173\"));\n" +
               "                conf.setAllowedMethods(List.of(\"GET\", \"POST\", \"PUT\", \"DELETE\", \"OPTIONS\"));\n" +
               "                conf.setAllowedHeaders(List.of(\"*\"));\n" +
               "                conf.setAllowCredentials(true);\n" +
               "                return conf;\n" +
               "            }))\n" +
               "            .csrf(AbstractHttpConfigurer::disable)\n" +
               "            .authorizeHttpRequests(auth -> auth\n" +
               "                .requestMatchers(\"/api/auth/**\").permitAll()\n" +
               "                .anyRequest().authenticated()\n" +
               "            )\n" +
               "            .sessionManagement(sess -> sess.sessionCreationPolicy(SessionCreationPolicy.STATELESS))\n" +
               "            .authenticationProvider(authenticationProvider())\n" +
               "            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);\n" +
               "        return http.build();\n" +
               "    }\n\n" +
               "    @Bean\n" +
               "    public AuthenticationProvider authenticationProvider() {\n" +
               "        DaoAuthenticationProvider authProvider = new DaoAuthenticationProvider();\n" +
               "        authProvider.setUserDetailsService(userDetailsService);\n" +
               "        authProvider.setPasswordEncoder(passwordEncoder());\n" +
               "        return authProvider;\n" +
               "    }\n\n" +
               "    @Bean\n" +
               "    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {\n" +
               "        return config.getAuthenticationManager();\n" +
               "    }\n\n" +
               "    @Bean\n" +
               "    public PasswordEncoder passwordEncoder() {\n" +
               "        return new BCryptPasswordEncoder();\n" +
               "    }\n" +
               "}\n";
    }

    private String getUserDetailsServiceImplCode(String basePackage) {
        return "package " + basePackage + ".security;\n\n" +
               "import org.springframework.security.core.userdetails.UserDetails;\n" +
               "import org.springframework.security.core.userdetails.UserDetailsService;\n" +
               "import org.springframework.security.core.userdetails.UsernameNotFoundException;\n" +
               "import org.springframework.stereotype.Service;\n\n" +
               "@Service\n" +
               "public class UserDetailsServiceImpl implements UserDetailsService {\n" +
               "    private final UserRepository repository;\n\n" +
               "    public UserDetailsServiceImpl(UserRepository repository) {\n" +
               "        this.repository = repository;\n" +
               "    }\n\n" +
               "    @Override\n" +
               "    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {\n" +
               "        return repository.findByUsername(username)\n" +
               "                .orElseThrow(() -> new UsernameNotFoundException(\"User not found\"));\n" +
               "    }\n" +
               "}\n";
    }

    private String getAuthControllerCode(String basePackage) {
        return "package " + basePackage + ".security;\n\n" +
               "import org.springframework.http.ResponseEntity;\n" +
               "import org.springframework.security.authentication.AuthenticationManager;\n" +
               "import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;\n" +
               "import org.springframework.security.core.userdetails.UserDetails;\n" +
               "import org.springframework.security.crypto.password.PasswordEncoder;\n" +
               "import org.springframework.web.bind.annotation.*;\n\n" +
               "@RestController\n" +
               "@RequestMapping(\"/api/auth\")\n" +
               "public class AuthController {\n" +
               "    private final AuthenticationManager authenticationManager;\n" +
               "    private final UserDetailsServiceImpl userDetailsService;\n" +
               "    private final UserRepository userRepository;\n" +
               "    private final PasswordEncoder passwordEncoder;\n" +
               "    private final JwtUtil jwtUtil;\n\n" +
               "    public AuthController(AuthenticationManager authenticationManager, UserDetailsServiceImpl userDetailsService, UserRepository userRepository, PasswordEncoder passwordEncoder, JwtUtil jwtUtil) {\n" +
               "        this.authenticationManager = authenticationManager;\n" +
               "        this.userDetailsService = userDetailsService;\n" +
               "        this.userRepository = userRepository;\n" +
               "        this.passwordEncoder = passwordEncoder;\n" +
               "        this.jwtUtil = jwtUtil;\n" +
               "    }\n\n" +
               "    @PostMapping(\"/login\")\n" +
               "    public ResponseEntity<?> login(@RequestBody AuthRequest request) {\n" +
               "        authenticationManager.authenticate(new UsernamePasswordAuthenticationToken(request.getUsername(), request.getPassword()));\n" +
               "        UserDetails user = userDetailsService.loadUserByUsername(request.getUsername());\n" +
               "        String token = jwtUtil.generateToken(user);\n" +
               "        return ResponseEntity.ok(new AuthResponse(token));\n" +
               "    }\n\n" +
               "    @PostMapping(\"/register\")\n" +
               "    public ResponseEntity<?> register(@RequestBody AuthRequest request) {\n" +
               "        if (userRepository.findByUsername(request.getUsername()).isPresent()) {\n" +
               "            return ResponseEntity.badRequest().body(\"Username is already taken\");\n" +
               "        }\n" +
               "        User user = new User();\n" +
               "        user.setUsername(request.getUsername());\n" +
               "        user.setPassword(passwordEncoder.encode(request.getPassword()));\n" +
               "        user.setRole(\"ROLE_ADMIN\");\n" +
               "        userRepository.save(user);\n" +
               "        String token = jwtUtil.generateToken(user);\n" +
               "        return ResponseEntity.ok(new AuthResponse(token));\n" +
               "    }\n\n" +
               "    public static class AuthRequest {\n" +
               "        private String username;\n" +
               "        private String password;\n" +
               "        public String getUsername() { return username; }\n" +
               "        public void setUsername(String username) { this.username = username; }\n" +
               "        public String getPassword() { return password; }\n" +
               "        public void setPassword(String password) { this.password = password; }\n" +
               "    }\n\n" +
               "    public static class AuthResponse {\n" +
               "        private String token;\n" +
               "        public AuthResponse(String token) { this.token = token; }\n" +
               "        public String getToken() { return token; }\n" +
               "        public void setToken(String token) { this.token = token; }\n" +
               "    }\n" +
               "}\n";
    }
}
