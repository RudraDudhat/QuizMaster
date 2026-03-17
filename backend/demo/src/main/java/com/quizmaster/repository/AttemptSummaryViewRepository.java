package com.quizmaster.repository;

import com.quizmaster.entity.AttemptSummaryView;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AttemptSummaryViewRepository extends JpaRepository<AttemptSummaryView, Long> {

    List<AttemptSummaryView> findByQuizId(Long quizId);

    List<AttemptSummaryView> findByQuizIdAndStatus(Long quizId, String status);
}
