package com.quizmaster.repository;

import com.quizmaster.entity.OAuthProvider;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface OAuthProviderRepository extends JpaRepository<OAuthProvider, Long> {

    Optional<OAuthProvider> findByProviderAndProviderUid(String provider, String providerUid);
}
