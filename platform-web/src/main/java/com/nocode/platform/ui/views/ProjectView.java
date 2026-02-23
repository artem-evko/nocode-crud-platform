package com.nocode.platform.ui.views;

import com.nocode.platform.project.ProjectEntity;
import com.nocode.platform.project.ProjectService;
import com.nocode.platform.ui.MainLayout;
import com.vaadin.flow.component.AttachEvent;
import com.vaadin.flow.component.button.Button;
import com.vaadin.flow.component.html.H2;
import com.vaadin.flow.component.html.Paragraph;
import com.vaadin.flow.component.notification.Notification;
import com.vaadin.flow.component.orderedlayout.VerticalLayout;
import com.vaadin.flow.component.textfield.TextArea;
import com.vaadin.flow.router.*;

import java.util.UUID;

@Route(value = "projects/:id", layout = MainLayout.class)
@PageTitle("Project | No-code CRUD Platform")
public class ProjectView extends VerticalLayout implements BeforeEnterObserver {

    private final ProjectService projectService;

    private UUID projectId;

    private final H2 title = new H2("Project");
    private final Paragraph meta = new Paragraph();
    private final TextArea spec = new TextArea("Spec (YAML)");
    private final Button save = new Button("Save");

    public ProjectView(ProjectService projectService) {
        this.projectService = projectService;

        setPadding(true);
        setSpacing(true);

        spec.setWidthFull();
        spec.setHeight("60vh");

        save.addClickListener(e -> {
            if (projectId == null) return;
            projectService.updateSpec(projectId, spec.getValue());
            Notification.show("Saved");
        });

        add(title, meta, spec, save);
    }

    @Override
    public void beforeEnter(BeforeEnterEvent event) {
        String idStr = event.getRouteParameters().get("id").orElse(null);
        if (idStr == null) {
            event.rerouteTo("");
            return;
        }
        try {
            projectId = UUID.fromString(idStr);
        } catch (Exception ex) {
            event.rerouteTo("");
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

        spec.setValue(p.getSpecText() == null ? "" : p.getSpecText());
    }
}