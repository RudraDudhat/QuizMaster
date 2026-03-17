package com.quizmaster.security;

import com.quizmaster.dto.response.AuthResponse;
import com.quizmaster.entity.OAuthProvider;
import com.quizmaster.entity.User;
import com.quizmaster.enums.UserRole;
import com.quizmaster.repository.OAuthProviderRepository;
import com.quizmaster.repository.UserRepository;
import com.quizmaster.service.AuthService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.util.UriComponentsBuilder;

import java.io.IOException;
import java.util.Map;

@Component
@RequiredArgsConstructor
public class OAuth2AuthenticationSuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

        private final UserRepository userRepository;
        private final OAuthProviderRepository oauthProviderRepository;
        private final AuthService authService;

        @Value("${app.frontend-url}")
        private String frontendUrl;

        @Override
        @Transactional
        public void onAuthenticationSuccess(
                        HttpServletRequest request,
                        HttpServletResponse response,
                        Authentication authentication) throws IOException {

                OAuth2User oAuth2User = (OAuth2User) authentication.getPrincipal();
                Map<String, Object> attributes = oAuth2User.getAttributes();

                String email = (String) attributes.get("email");
                String name = (String) attributes.get("name");
                String picture = (String) attributes.get("picture");
                String googleId = (String) attributes.get("sub");

                // 1. Find or create user
                User user = userRepository.findByEmail(email).orElseGet(() -> {
                        User newUser = User.builder()
                                        .email(email)
                                        .fullName(name != null ? name : email)
                                        .profilePictureUrl(picture)
                                        .role(UserRole.STUDENT)
                                        .isActive(true)
                                        .isEmailVerified(true)
                                        .xpPoints(0)
                                        .streakDays(0)
                                        .build();
                        return userRepository.save(newUser);
                });

                // 2. Link OAuth provider if not already linked
                oauthProviderRepository.findByProviderAndProviderUid("GOOGLE", googleId)
                                .orElseGet(() -> {
                                        OAuthProvider provider = OAuthProvider.builder()
                                                        .user(user)
                                                        .provider("GOOGLE")
                                                        .providerUid(googleId)
                                                        .build();
                                        return oauthProviderRepository.save(provider);
                                });

                // 3. Generate JWT tokens via AuthService
                AuthResponse authResponse = authService.buildAuthResponse(user);

                // 4. Redirect to frontend callback with tokens
                String redirectUrl = UriComponentsBuilder.fromUriString(frontendUrl + "/oauth2/callback")
                                .queryParam("access_token", authResponse.getAccessToken())
                                .queryParam("refresh_token", authResponse.getRefreshToken())
                                .queryParam("expires_in", authResponse.getExpiresIn())
                                .build().toUriString();

                getRedirectStrategy().sendRedirect(request, response, redirectUrl);
        }
}
