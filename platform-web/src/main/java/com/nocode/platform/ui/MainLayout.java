package com.nocode.platform.ui;

import com.vaadin.flow.component.applayout.AppLayout;
import com.vaadin.flow.component.html.H1;
import com.vaadin.flow.component.orderedlayout.HorizontalLayout;
import com.vaadin.flow.router.RouterLink;

public class MainLayout extends AppLayout {

    public MainLayout() {
        H1 title = new H1("No-code CRUD Platform");
        title.getStyle().set("margin", "0").set("font-size", "var(--lumo-font-size-l)");

        HorizontalLayout header = new HorizontalLayout(
                title,
                new RouterLink("Projects", com.nocode.platform.ui.views.ProjectsView.class)
        );
        header.setWidthFull();
        header.setPadding(true);
        header.setDefaultVerticalComponentAlignment(HorizontalLayout.Alignment.CENTER);
        header.expand(title);

        addToNavbar(header);
    }
}