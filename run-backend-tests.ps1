$ErrorActionPreference = "Stop"

$ProjectRoot = $PSScriptRoot
$BackendRoot = Join-Path $ProjectRoot "backend"
$DefaultJdkHome = "C:\Program Files\Eclipse Adoptium\jdk-17.0.19.10-hotspot"
$JdkHome = $env:JAVA_HOME
if (-not $JdkHome -or -not (Test-Path -LiteralPath (Join-Path $JdkHome "bin\java.exe"))) {
    $JdkHome = $DefaultJdkHome
}
$MavenHome = Join-Path $ProjectRoot "tools\apache-maven-3.9.16"
$MavenCmd = Join-Path $MavenHome "bin\mvn.cmd"
$WrapperCmd = Join-Path $BackendRoot "mvnw.cmd"

if (-not (Test-Path -LiteralPath (Join-Path $JdkHome "bin\java.exe"))) {
    $FoundJava = Get-Command java -ErrorAction SilentlyContinue
    if (-not $FoundJava) {
        throw "JDK 17 was not found. Install JDK 17 or set JAVA_HOME."
    }
    $JdkHome = $null
}

if (Test-Path -LiteralPath $WrapperCmd) {
    $MavenCmd = $WrapperCmd
    $MavenHome = $null
} elseif (-not (Test-Path -LiteralPath $MavenCmd)) {
    $FoundMaven = Get-Command mvn.cmd -ErrorAction SilentlyContinue
    if (-not $FoundMaven) {
        $FoundMaven = Get-Command mvn -ErrorAction SilentlyContinue
    }
    if (-not $FoundMaven) {
        throw "Maven was not found. Use backend\mvnw.cmd, put Maven into tools\apache-maven-3.9.16, or install Maven globally."
    }
    $MavenCmd = $FoundMaven.Source
    $MavenHome = Split-Path (Split-Path $MavenCmd -Parent) -Parent
}

if ($JdkHome) {
    $env:JAVA_HOME = $JdkHome
    $env:Path = "$JdkHome\bin;$env:Path"
}
if ($MavenHome) {
    $env:Path = "$MavenHome\bin;$env:Path"
}

Push-Location -LiteralPath $BackendRoot
try {
    & $MavenCmd test
} finally {
    Pop-Location
}
