package ${basePackage}.ui;

import com.vaadin.flow.component.html.H1;
import com.vaadin.flow.component.orderedlayout.VerticalLayout;
import com.vaadin.flow.router.PageTitle;
import com.vaadin.flow.router.Route;

@Route("")
@PageTitle("${appName}")
public class MainView extends VerticalLayout {

    public MainView() {
        setPadding(true);
        setSpacing(true);
        add(new H1("${appName} (generated)"));
    }
}