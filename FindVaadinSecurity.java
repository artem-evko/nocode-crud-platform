import java.lang.reflect.Method;
import java.net.URL;
import java.net.URLClassLoader;
import java.io.File;

public class FindVaadinSecurity {
    public static void main(String[] args) throws Exception {
        String cpPath = "platform-web/cp.txt";
        String cp = java.nio.file.Files.readString(java.nio.file.Paths.get(cpPath));
        String[] paths = cp.split(";");
        URL[] urls = new URL[paths.length];
        for (int i = 0; i < paths.length; i++) {
            urls[i] = new File(paths[i]).toURI().toURL();
        }
        URLClassLoader cl = new URLClassLoader(urls, FindVaadinSecurity.class.getClassLoader());
        Class<?> clazz = cl.loadClass("com.vaadin.flow.spring.security.VaadinSecurityConfigurer");
        System.out.println("CLASS: " + clazz.getName());
        for (Method m : clazz.getDeclaredMethods()) {
            System.out.println("METHOD: " + m.getName() + " STATIC=" + java.lang.reflect.Modifier.isStatic(m.getModifiers()) + " PARAMS=" + m.getParameterCount());
            for (Class<?> p : m.getParameterTypes()) {
                System.out.println("  " + p.getName());
            }
        }
    }
}
