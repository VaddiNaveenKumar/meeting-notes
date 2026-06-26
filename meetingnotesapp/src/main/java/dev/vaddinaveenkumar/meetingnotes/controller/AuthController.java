package dev.vaddinaveenkumar.meetingnotes.controller;

import dev.vaddinaveenkumar.meetingnotes.model.AppUser;
import dev.vaddinaveenkumar.meetingnotes.repo.AppUserRepository;
import dev.vaddinaveenkumar.meetingnotes.service.JwtService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.core.annotation.AuthenticationPrincipal;

import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AppUserRepository userRepository;
    private final JwtService jwtService;
    private final PasswordEncoder passwordEncoder;

    public AuthController(AppUserRepository userRepository, JwtService jwtService, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.jwtService = jwtService;
        this.passwordEncoder = passwordEncoder;
    }

    @PostMapping("/anonymous")
    public ResponseEntity<?> createAnonymous() {
        AppUser anonUser = new AppUser(true);
        userRepository.save(anonUser);
        
        String token = jwtService.generateToken(anonUser.getId().toString());
        return ResponseEntity.ok(Map.of("token", token, "userId", anonUser.getId()));
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestBody Map<String, String> request) {
        
        String email = request.get("email");
        String password = request.get("password");
        
        if (email == null || password == null) {
            return ResponseEntity.badRequest().body("Email and password are required.");
        }

        // Check if email already exists
        if (userRepository.findByEmail(email).isPresent()) {
            return ResponseEntity.badRequest().body("Email already in use.");
        }

        AppUser user = null;
        
        // If they pass an anonymous token, upgrade the account!
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String jwt = authHeader.substring(7);
            if (jwtService.isTokenValid(jwt)) {
                String userId = jwtService.extractUsername(jwt);
                Optional<AppUser> existingOpt = userRepository.findById(UUID.fromString(userId));
                if (existingOpt.isPresent() && existingOpt.get().isAnonymous()) {
                    user = existingOpt.get();
                    user.setAnonymous(false);
                }
            }
        }
        
        // Otherwise create a new account
        if (user == null) {
            user = new AppUser(false);
        }
        
        user.setEmail(email);
        user.setPasswordHash(passwordEncoder.encode(password)); // BCrypt hashed
        userRepository.save(user);

        String newToken = jwtService.generateToken(user.getId().toString());
        return ResponseEntity.ok(Map.of("token", newToken, "userId", user.getId()));
    }
    
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> request) {
        String email = request.get("email");
        String password = request.get("password");
        
        Optional<AppUser> userOpt = userRepository.findByEmail(email);
        if (userOpt.isPresent()) {
            AppUser user = userOpt.get();
            if (passwordEncoder.matches(password, user.getPasswordHash())) { // BCrypt comparison
                String token = jwtService.generateToken(user.getId().toString());
                return ResponseEntity.ok(Map.of("token", token, "userId", user.getId()));
            }
        }
        return ResponseEntity.status(401).body("Invalid credentials");
    }
}
