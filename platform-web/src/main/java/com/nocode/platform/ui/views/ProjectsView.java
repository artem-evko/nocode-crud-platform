package com.nocode.platform.ui.views;

import com.nocode.platform.project.CreateProjectRequest;
import com.nocode.platform.project.ProjectEntity;
import com.nocode.platform.project.ProjectService;
import com.nocode.platform.ui.MainLayout;
import com.vaadin.flow.component.AttachEvent;
import com.vaadin.flow.component.button.Button;
import com.vaadin.flow.component.dialog.Dialog;
import com.vaadin.flow.component.formlayout.FormLayout;
import com.vaadin.flow.component.grid.Grid;
import com.vaadin.flow.component.html.H2;
import com.vaadin.flow.component.notification.Notification;
import com.vaadin.flow.component.orderedlayout.HorizontalLayout;
import com.vaadin.flow.component.orderedlayout.VerticalLayout;
import com.vaadin.flow.component.textfield.TextArea;
import com.vaadin.flow.component.textfield.TextField;
import com.vaadin.flow.router.PageTitle;
import com.vaadin.flow.router.Route;
import jakarta.annotation.security.PermitAll;

import java.util.List;

@Route(value = "projects", layout = MainLayout.class)
@PageTitle("Projects | No-code CRUD Platform")
@PermitAll
public class ProjectsView extends VerticalLayout {

    private final ProjectService projectService;
    private final Grid<ProjectEntity> grid = new Grid<>(ProjectEntity.class, false);

    public ProjectsView(ProjectService projectService) {
        this.projectService = projectService;

        setPadding(true);
        setSpacing(true);

        add(new H2("Projects (MVP)"));

        configureGrid();
        add(buildToolbar(), grid);
    }

    @Override
    protected void onAttach(AttachEvent attachEvent) {
        super.onAttach(attachEvent);
        try {
            refresh();
        } catch (Exception ex) {
            Notification.show("DB not ready: " + ex.getMessage());
        }
    }

    private HorizontalLayout buildToolbar() {
        Button create = new Button("Create project", e -> openCreateDialog());
        return new HorizontalLayout(create);
    }

    private void configureGrid() {
        grid.addColumn(ProjectEntity::getName).setHeader("Name").setAutoWidth(true);
        grid.addColumn(ProjectEntity::getGroupId).setHeader("GroupId").setAutoWidth(true);
        grid.addColumn(ProjectEntity::getArtifactId).setHeader("ArtifactId").setAutoWidth(true);
        grid.addColumn(ProjectEntity::getVersion).setHeader("Version").setAutoWidth(true);
        grid.addColumn(ProjectEntity::getBasePackage).setHeader("Base package").setAutoWidth(true);

        grid.setWidthFull();
        grid.setHeight("70vh");

        grid.addItemClickListener(e -> {
            var id = e.getItem().getId();
            getUI().ifPresent(ui -> ui.navigate("projects/" + id));
        });
    }

    private void refresh() {
        List<ProjectEntity> items = projectService.list();
        grid.setItems(items);
    }

    private void openCreateDialog() {
        Dialog dialog = new Dialog();
        dialog.setHeaderTitle("Create project");

        TextField name = new TextField("Name");
        TextField groupId = new TextField("GroupId");
        TextField artifactId = new TextField("ArtifactId");
        TextField version = new TextField("Version");
        TextField basePackage = new TextField("Base package");

        // дефолты для удобства
        version.setValue("0.1.0-SNAPSHOT");
        groupId.setValue("com.example");
        basePackage.setValue("com.example.app");

        FormLayout form = new FormLayout(name, groupId, artifactId, version, basePackage);
        form.setWidth("600px");

        Button cancel = new Button("Cancel", e -> dialog.close());
        Button save = new Button("Save", e -> {
            if (isBlank(name.getValue()) || isBlank(groupId.getValue()) || isBlank(artifactId.getValue())
                    || isBlank(version.getValue()) || isBlank(basePackage.getValue())) {
                Notification.show("Fill all fields");
                return;
            }

            projectService.create(new CreateProjectRequest(
                    name.getValue(),
                    groupId.getValue(),
                    artifactId.getValue(),
                    version.getValue(),
                    basePackage.getValue(),
                    "" // empty spec text, will be built dynamically
            ));

            dialog.close();
            refresh();
            Notification.show("Created");
        });

        dialog.add(form);
        dialog.getFooter().add(cancel, save);
        dialog.open();
    }

    private boolean isBlank(String s) {
        return s == null || s.trim().isEmpty();
    }
}