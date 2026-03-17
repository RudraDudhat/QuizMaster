package com.quizmaster.repository;

import com.quizmaster.entity.QuestionAccuracyView;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface QuestionAccuracyViewRepository
        extends JpaRepository<QuestionAccuracyView, QuestionAccuracyView.QuestionAccuracyId> {

    List<QuestionAccuracyView> findByQuizId(Long quizId);
}
