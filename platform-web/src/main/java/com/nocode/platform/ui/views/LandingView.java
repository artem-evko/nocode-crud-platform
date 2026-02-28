package com.nocode.platform.ui.views;

import com.vaadin.flow.component.UI;
import com.vaadin.flow.component.button.Button;
import com.vaadin.flow.component.dependency.CssImport;
import com.vaadin.flow.component.html.Div;
import com.vaadin.flow.component.html.H1;
import com.vaadin.flow.component.html.Paragraph;
import com.vaadin.flow.component.orderedlayout.FlexComponent;
import com.vaadin.flow.component.orderedlayout.VerticalLayout;
import com.vaadin.flow.router.PageTitle;
import com.vaadin.flow.router.Route;
import com.vaadin.flow.server.auth.AnonymousAllowed;

@Route("")
@PageTitle("No-Code Platform | Build Apps Instantly")
@AnonymousAllowed
@CssImport("./landing.css")
public class LandingView extends VerticalLayout {

    public LandingView() {
        setSizeFull();
        setMargin(false);
        setPadding(false);
        setSpacing(false);
        setAlignItems(FlexComponent.Alignment.CENTER);
        setJustifyContentMode(FlexComponent.JustifyContentMode.CENTER);

        // Apply external CSS class for background
        addClassName("landing-background");

        // Background decorative blurred circles
        Div blurCircle1 = new Div();
        blurCircle1.addClassName("blur-circle-1");

        Div blurCircle2 = new Div();
        blurCircle2.addClassName("blur-circle-2");

        // Glassmorphism central panel
        VerticalLayout glassPanel = new VerticalLayout();
        glassPanel.addClassName("glass-panel");
        glassPanel.setAlignItems(Alignment.CENTER);

        H1 title = new H1("Build Spring Boot Apps in Minutes");
        title.addClassName("landing-title");

        Paragraph subtitle = new Paragraph("Generate production-ready Java code, JPA entities, and Liquibase migrations instantly without writing boilerplate.");
        subtitle.addClassName("landing-subtitle");

        Button ctaButton = new Button("Start Building - Free");
        ctaButton.addClassName("landing-cta");
        ctaButton.addClickListener(e -> UI.getCurrent().navigate("login"));

        glassPanel.add(title, subtitle, ctaButton);
        add(blurCircle1, blurCircle2, glassPanel);
    }
}
