plugins {
    application
    id("com.gradleup.shadow") version "9.3.1"
}

application.mainClass = "it.lycoris.disboard.DiscordBridge"
group = "it.lycoris.disboard"
version = "1.0.0"

val jdaVersion = "6.3.0"
val jdaveVersion = "0.1.5"

repositories {
    mavenCentral()
}

dependencies {
    implementation("net.dv8tion:JDA:$jdaVersion")
    implementation("club.minnced:jdave-api:$jdaveVersion")
    implementation("club.minnced:jdave-native-linux-x86-64:$jdaveVersion")
    implementation("club.minnced:jdave-native-linux-aarch64:$jdaveVersion")
    implementation("club.minnced:jdave-native-win-x86-64:$jdaveVersion")
    implementation("club.minnced:jdave-native-darwin:$jdaveVersion")
    implementation("net.sf.jopt-simple:jopt-simple:5.0.4")
    implementation("ch.qos.logback:logback-classic:1.5.25")
    implementation("tools.jackson.core:jackson-databind:3.0.4")
}

java {
    toolchain {
        languageVersion.set(JavaLanguageVersion.of(25))
    }
}

tasks.withType<JavaCompile> {
    options.encoding = "UTF-8"
}

tasks.jar {
    manifest {
        attributes(
            "Main-Class" to application.mainClass.get(),
            "Enable-Native-Access" to "ALL-UNNAMED"
        )
    }
}

tasks.shadowJar {
    mergeServiceFiles()
    manifest {
        attributes(
            "Main-Class" to application.mainClass.get(),
            "Enable-Native-Access" to "ALL-UNNAMED"
        )
    }
    archiveFileName = "${project.name}.jar"
}