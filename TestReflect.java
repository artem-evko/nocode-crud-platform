import java.lang.reflect.Method;
import java.net.URL;
import java.net.URLClassLoader;
import java.io.File;

public class TestReflect {
    public static void main(String[] args) throws Exception {
        File f = new File("C:/Users/ASUS/.m2/repository/com/vaadin/vaadin-spring/25.0.5/vaadin-spring-25.0.5.jar");
        URL[] urls = {f.toURI().toURL()};
        URLClassLoader cl = new URLClassLoader(urls, TestReflect.class.getClassLoader());
        Class<?> clazz = cl.loadClass("com.vaadin.flow.spring.security.VaadinSecurityConfigurer");
        System.out.println("CLASS: " + clazz.getName());
        for (Method m : clazz.getDeclaredMethods()) {
            System.out.println("METHOD: " + m.getName() + " STATIC=" + java.lang.reflect.Modifier.isStatic(m.getModifiers()));
        }
    }
}
