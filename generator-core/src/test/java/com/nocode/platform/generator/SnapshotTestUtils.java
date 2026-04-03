package com.nocode.platform.generator;

import org.junit.jupiter.api.Assertions;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

public class SnapshotTestUtils {
    
    private static final String SNAPSHOTS_DIR = "src/test/resources/snapshots";
    private static final boolean UPDATE_SNAPSHOTS = Boolean.parseBoolean(System.getProperty("updateSnapshots", "false"));

    public static void assertSnapshotMatch(String snapshotName, String actualContent) throws IOException {
        Path snapshotPath = Paths.get(SNAPSHOTS_DIR, snapshotName + ".txt");
        
        if (!Files.exists(snapshotPath) || UPDATE_SNAPSHOTS) {
            Files.createDirectories(snapshotPath.getParent());
            Files.writeString(snapshotPath, actualContent);
            if (!UPDATE_SNAPSHOTS) {
                System.out.println("Created initial snapshot: " + snapshotPath);
            } else {
                System.out.println("Updated snapshot: " + snapshotPath);
            }
        } else {
            String expectedContent = Files.readString(snapshotPath);
            // Нормализация переводов строк для кросс-платформенности
            expectedContent = expectedContent.replace("\r\n", "\n").trim();
            actualContent = actualContent.replace("\r\n", "\n").trim();
            
            Assertions.assertEquals(expectedContent, actualContent, "Snapshot mismatch for " + snapshotName + ". Если вы сознательно изменили логику генератора, удалите этот файл (или используйте -DupdateSnapshots=true), чтобы он пересоздался.");
        }
    }
}
