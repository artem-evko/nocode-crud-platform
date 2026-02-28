package com.nocode.platform.ui;

import com.vaadin.flow.component.applayout.AppLayout;
import com.vaadin.flow.component.button.Button;
import com.vaadin.flow.component.html.H1;
import com.vaadin.flow.component.orderedlayout.FlexComponent;
import com.vaadin.flow.component.orderedlayout.HorizontalLayout;
import com.vaadin.flow.router.RouterLink;
import com.vaadin.flow.spring.security.AuthenticationContext;
import org.springframework.security.core.userdetails.UserDetails;

public class MainLayout extends AppLayout {

    private final transient AuthenticationContext authContext;

    public MainLayout(AuthenticationContext authContext) {
        this.authContext = authContext;

        H1 title = new H1("No-code CRUD Platform");
        title.getStyle().set("margin", "0")
             .set("font-size", "var(--lumo-font-size-l)")
             .set("cursor", "pointer");
        title.addClickListener(e -> title.getUI().ifPresent(ui -> ui.navigate("")));

        HorizontalLayout header = new HorizontalLayout(
                title,
                new RouterLink("Projects", com.nocode.platform.ui.views.ProjectsView.class)
        );
        header.setWidthFull();
        header.setPadding(true);
        header.setDefaultVerticalComponentAlignment(FlexComponent.Alignment.CENTER);
        header.expand(title);

        authContext.getAuthenticatedUser(UserDetails.class).ifPresent(user -> {
            Button logout = new Button("Log out (" + user.getUsername() + ")", e -> this.authContext.logout());
            header.add(logout);
        });

        addToNavbar(header);
    }
}