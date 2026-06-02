$ErrorActionPreference = "Stop"

$ProjectRoot = $PSScriptRoot
$DefaultJdkHome = "C:\Program Files\Eclipse Adoptium\jdk-17.0.19.10-hotspot"
$JdkHome = $env:JAVA_HOME
if (-not $JdkHome -or -not (Test-Path -LiteralPath (Join-Path $JdkHome "bin\java.exe"))) {
    $JdkHome = $DefaultJdkHome
}
$MavenHome = Join-Path $ProjectRoot "tools\apache-maven-3.9.16"
$MavenCmd = Join-Path $MavenHome "bin\mvn.cmd"
$PomPath = Join-Path $ProjectRoot "backend\pom.xml"

if (-not (Test-Path -LiteralPath (Join-Path $JdkHome "bin\java.exe"))) {
    throw "JDK 17 was not found. Install JDK 17 and set JAVA_HOME."
}

if (-not (Test-Path -LiteralPath $MavenCmd)) {
    $FoundMaven = Get-Command mvn.cmd -ErrorAction SilentlyContinue
    if (-not $FoundMaven) {
        $FoundMaven = Get-Command mvn -ErrorAction SilentlyContinue
    }
    if (-not $FoundMaven) {
        throw "Maven was not found. Put Maven into tools\apache-maven-3.9.16 or install Maven globally."
    }
    $MavenCmd = $FoundMaven.Source
    $MavenHome = Split-Path (Split-Path $MavenCmd -Parent) -Parent
}

$env:JAVA_HOME = $JdkHome
$env:Path = "$JdkHome\bin;$MavenHome\bin;$env:Path"

& $MavenCmd -f $PomPath test
