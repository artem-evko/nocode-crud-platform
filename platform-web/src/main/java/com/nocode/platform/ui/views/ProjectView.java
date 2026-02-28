package com.nocode.platform.ui.views;

import com.nocode.platform.generator.GeneratorFacade;
import com.nocode.platform.project.ProjectEntity;
import com.nocode.platform.project.ProjectService;
import com.nocode.platform.ui.MainLayout;
import com.vaadin.flow.component.AttachEvent;
import com.vaadin.flow.component.button.Button;
import com.vaadin.flow.component.html.H2;
import com.vaadin.flow.component.orderedlayout.VerticalLayout;
import com.vaadin.flow.component.textfield.TextArea;
import com.vaadin.flow.component.html.Paragraph;
import com.vaadin.flow.router.BeforeEnterEvent;
import com.vaadin.flow.router.BeforeEnterObserver;
import com.vaadin.flow.router.PageTitle;
import com.vaadin.flow.router.Route;
import jakarta.annotation.security.PermitAll;
import com.nocode.platform.ui.views.EntityModelerView;

import java.util.UUID;

@Route(value = "projects/:id", layout = MainLayout.class)
@PageTitle("Project | No-code CRUD Platform")
@PermitAll
public class ProjectView extends VerticalLayout implements BeforeEnterObserver {

    private final ProjectService projectService;

    private UUID projectId;

    private final H2 title = new H2("Project");
    private final Paragraph meta = new Paragraph();
    private final EntityModelerView entityModelerView;

    public ProjectView(ProjectService projectService, GeneratorFacade generatorFacade) {
        this.projectService = projectService;

        setPadding(true);
        setSpacing(true);
        setSizeFull();

        entityModelerView = new EntityModelerView(projectService);

        Button generate = new Button("Generate ZIP");
        generate.addThemeVariants(com.vaadin.flow.component.button.ButtonVariant.LUMO_PRIMARY, com.vaadin.flow.component.button.ButtonVariant.LUMO_SUCCESS);
        generate.addClickListener(e -> {
            if (projectId == null) return;
            getUI().ifPresent(ui -> ui.getPage().open("/api/projects/" + projectId + "/download"));
        });

        add(title, meta, generate, entityModelerView);
    }

    @Override
    public void beforeEnter(BeforeEnterEvent event) {
        String idStr = event.getRouteParameters().get("id").orElse(null);
        if (idStr == null) {
            event.rerouteTo("projects");
            return;
        }
        try {
            projectId = UUID.fromString(idStr);
        } catch (Exception ex) {
            event.rerouteTo("projects");
        }
    }

    @Override
    protected void onAttach(AttachEvent attachEvent) {
        super.onAttach(attachEvent);
        if (projectId == null) return;

        ProjectEntity p = projectService.get(projectId);

        title.setText(p.getName());
        meta.setText(p.getGroupId() + ":" + p.getArtifactId() + ":" + p.getVersion()
                + " | basePackage=" + p.getBasePackage());

        entityModelerView.setProject(p);
    }
}