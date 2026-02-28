package com.nocode.platform.ui.views;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.dataformat.yaml.YAMLFactory;
import com.nocode.platform.generator.spec.Spec;
import com.nocode.platform.project.ProjectEntity;
import com.nocode.platform.project.ProjectService;
import com.vaadin.flow.component.button.Button;
import com.vaadin.flow.component.button.ButtonVariant;
import com.vaadin.flow.component.combobox.ComboBox;
import com.vaadin.flow.component.dialog.Dialog;
import com.vaadin.flow.component.grid.Grid;
import com.vaadin.flow.component.html.H3;
import com.vaadin.flow.component.icon.VaadinIcon;
import com.vaadin.flow.component.notification.Notification;
import com.vaadin.flow.component.orderedlayout.HorizontalLayout;
import com.vaadin.flow.component.orderedlayout.VerticalLayout;
import com.vaadin.flow.component.textfield.TextField;

import java.util.ArrayList;
import java.util.List;

public class EntityModelerView extends VerticalLayout {

    private final ProjectService projectService;
    private ProjectEntity projectEntity;
    private Spec currentSpec;

    private final Grid<Spec.Entity> entityGrid = new Grid<>(Spec.Entity.class, false);
    private final ObjectMapper mapper = new ObjectMapper(new YAMLFactory());

    public EntityModelerView(ProjectService projectService) {
        this.projectService = projectService;
        
        setPadding(false);
        setSpacing(true);
        setSizeFull();

        H3 title = new H3("Data Modeler");
        
        Button addEntityBtn = new Button("New Entity", VaadinIcon.PLUS.create());
        addEntityBtn.addThemeVariants(ButtonVariant.LUMO_PRIMARY);
        addEntityBtn.addClickListener(e -> openEntityDialog(null));

        HorizontalLayout toolbar = new HorizontalLayout(title, addEntityBtn);
        toolbar.setDefaultVerticalComponentAlignment(Alignment.CENTER);
        toolbar.setWidthFull();
        toolbar.setJustifyContentMode(JustifyContentMode.BETWEEN);

        entityGrid.addColumn(Spec.Entity::name).setHeader("Entity Name").setFlexGrow(1);
        entityGrid.addColumn(Spec.Entity::table).setHeader("Table Name").setFlexGrow(1);
        entityGrid.addColumn(e -> e.fields() != null ? e.fields().size() : 0).setHeader("Fields").setFlexGrow(0);
        entityGrid.addComponentColumn(entity -> {
            Button edit = new Button(VaadinIcon.EDIT.create(), e -> openEntityDialog(entity));
            edit.addThemeVariants(ButtonVariant.LUMO_TERTIARY);
            Button delete = new Button(VaadinIcon.TRASH.create(), e -> deleteEntity(entity));
            delete.addThemeVariants(ButtonVariant.LUMO_TERTIARY, ButtonVariant.LUMO_ERROR);
            return new HorizontalLayout(edit, delete);
        }).setHeader("Actions").setFlexGrow(0);

        add(toolbar, entityGrid);
    }

    public void setProject(ProjectEntity projectEntity) {
        this.projectEntity = projectEntity;
        loadSpec();
    }

    private void loadSpec() {
        if (projectEntity.getSpecText() != null && !projectEntity.getSpecText().isBlank()) {
            try {
                this.currentSpec = mapper.readValue(projectEntity.getSpecText(), Spec.class);
            } catch (Exception e) {
                Notification.show("Error parsing existing spec JSON/YAML");
                initEmptySpec();
            }
        } else {
            initEmptySpec();
        }
        refreshGrid();
    }

    private void initEmptySpec() {
        Spec.Project sp = new Spec.Project(
                projectEntity.getGroupId(),
                projectEntity.getArtifactId(),
                projectEntity.getName(),
                projectEntity.getBasePackage(),
                projectEntity.getVersion()
        );
        this.currentSpec = new Spec(1, sp, new ArrayList<>());
    }

    private void refreshGrid() {
        if (currentSpec.entities() == null) {
            currentSpec = new Spec(currentSpec.specVersion(), currentSpec.project(), new ArrayList<>());
        }
        entityGrid.setItems(currentSpec.entities());
    }

    private void openEntityDialog(Spec.Entity existing) {
        Dialog dialog = new Dialog();
        dialog.setHeaderTitle(existing == null ? "New Entity" : "Edit Entity");

        TextField nameField = new TextField("Entity Name (e.g. User)");
        TextField tableField = new TextField("Table Name (e.g. users)");
        
        if (existing != null) {
            nameField.setValue(existing.name());
            tableField.setValue(String.valueOf(existing.table()));
        }

        // --- Field Management Grid ---
        List<Spec.Field> tempFields = new ArrayList<>();
        if (existing != null && existing.fields() != null) tempFields.addAll(existing.fields());
        
        Grid<Spec.Field> fieldGrid = new Grid<>(Spec.Field.class, false);
        fieldGrid.setHeight("250px");
        fieldGrid.addColumn(Spec.Field::name).setHeader("Name");
        fieldGrid.addColumn(Spec.Field::type).setHeader("Type");
        fieldGrid.addComponentColumn(f -> {
            Button del = new Button(VaadinIcon.TRASH.create(), e -> {
                tempFields.remove(f);
                fieldGrid.setItems(tempFields);
            });
            del.addThemeVariants(ButtonVariant.LUMO_TERTIARY, ButtonVariant.LUMO_ERROR);
            return del;
        }).setHeader("");
        fieldGrid.setItems(tempFields);

        // Add Field inputs
        HorizontalLayout addFieldLayout = new HorizontalLayout();
        TextField fName = new TextField("Field Name (e.g. email)");
        ComboBox<Spec.FieldType> fType = new ComboBox<>("Type", Spec.FieldType.values());
        fType.setValue(Spec.FieldType.STRING);
        Button addFBtn = new Button("Add Field", e -> {
            if (!fName.isEmpty() && fType.getValue() != null) {
                tempFields.add(new Spec.Field(fName.getValue(), fType.getValue(), false, null, null, null));
                fieldGrid.setItems(tempFields);
                fName.clear();
            }
        });
        addFBtn.addThemeVariants(ButtonVariant.LUMO_PRIMARY);
        addFieldLayout.add(fName, fType, addFBtn);
        addFieldLayout.setDefaultVerticalComponentAlignment(Alignment.BASELINE);

        VerticalLayout layout = new VerticalLayout(nameField, tableField, new H3("Fields"), addFieldLayout, fieldGrid);

        Button save = new Button("Save", e -> {
            if (nameField.isEmpty() || tableField.isEmpty()) {
                Notification.show("Name and Table are required");
                return;
            }
            Spec.Entity updated = new Spec.Entity(nameField.getValue(), tableField.getValue(), new ArrayList<>(tempFields), existing != null ? existing.relations() : new ArrayList<>());
            List<Spec.Entity> entities = new ArrayList<>(currentSpec.entities());
            if (existing != null) entities.remove(existing);
            entities.add(updated);
            updateSpec(entities);
            dialog.close();
        });
        save.addThemeVariants(ButtonVariant.LUMO_PRIMARY);
        
        Button cancel = new Button("Cancel", e -> dialog.close());

        dialog.add(layout);
        dialog.getFooter().add(cancel, save);
        dialog.setWidth("600px");
        dialog.open();
    }

    private void deleteEntity(Spec.Entity entity) {
        List<Spec.Entity> entities = new ArrayList<>(currentSpec.entities());
        entities.remove(entity);
        updateSpec(entities);
    }

    private void updateSpec(List<Spec.Entity> newEntities) {
        this.currentSpec = new Spec(currentSpec.specVersion(), currentSpec.project(), newEntities);
        refreshGrid();
        saveToServer();
    }

    private void saveToServer() {
        try {
            String yaml = mapper.writeValueAsString(currentSpec);
            projectService.updateSpec(projectEntity.getId(), yaml);
            Notification.show("Saved dynamically");
        } catch (JsonProcessingException e) {
            Notification.show("Error saving spec");
        }
    }
}
