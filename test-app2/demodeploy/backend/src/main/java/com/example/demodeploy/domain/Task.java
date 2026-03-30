package com.example.demodeploy.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotNull;
import java.lang.Long;
import java.time.LocalDate;

@Entity
@Table(
        name = "tasks"
)
public class Task {
    @Id
    @GeneratedValue(
            strategy = GenerationType.IDENTITY
    )
    private Long id;

    @Column(
            name = "title",
            nullable = false
    )
    @NotNull
    private LocalDate title;

    public Long getId() {
        return this.id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public LocalDate getTitle() {
        return this.title;
    }

    public void setTitle(LocalDate title) {
        this.title = title;
    }
}
