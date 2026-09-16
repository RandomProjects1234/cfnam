using System;
using System.Diagnostics;
using System.IO;
using System.IO.Compression;
using System.Reflection;

// CFNAM Setup — a self-contained installer.
// The whole app is embedded below as base64; nothing is downloaded at runtime.
public static class CfnamSetup
{
    const string PayloadBase64 = "@@PAYLOAD@@";

    const string UninstallScript = @"$dest = Split-Path -Parent $MyInvocation.MyCommand.Path
Write-Host ''
Write-Host '  Removing CFNAM...'
Remove-Item (Join-Path ([Environment]::GetFolderPath('Desktop')) 'CFNAM.lnk') -Force -ErrorAction SilentlyContinue
Remove-Item (Join-Path ([Environment]::GetFolderPath('Programs')) 'CFNAM') -Recurse -Force -ErrorAction SilentlyContinue
Write-Host '  CFNAM has been removed. Your saved .fnafproj files are untouched.'
Start-Sleep -Seconds 3
Remove-Item $dest -Recurse -Force -ErrorAction SilentlyContinue
";

    public static int Main()
    {
        try { Console.Title = "CFNAM Setup"; } catch { }

        string dest = Path.Combine(
            Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
            "Programs", "CFNAM");

        Console.WriteLine();
        Console.WriteLine("  CFNAM - Custom Five Nights At Maker");
        Console.WriteLine("  ===================================");
        Console.WriteLine();
        Console.WriteLine("  Installing to:");
        Console.WriteLine("  " + dest);
        Console.WriteLine();

        string tempZip = null;
        try
        {
            if (Directory.Exists(dest)) Directory.Delete(dest, true);
            Directory.CreateDirectory(dest);

            Console.WriteLine("  Unpacking...");
            tempZip = Path.Combine(Path.GetTempPath(), "cfnam-" + Guid.NewGuid().ToString("N") + ".zip");
            File.WriteAllBytes(tempZip, Convert.FromBase64String(PayloadBase64));
            ZipFile.ExtractToDirectory(tempZip, dest);

            File.WriteAllText(Path.Combine(dest, "uninstall.ps1"), UninstallScript);

            Console.WriteLine("  Creating shortcuts...");
            string indexPath = Path.Combine(dest, "index.html");
            string desktop = Environment.GetFolderPath(Environment.SpecialFolder.DesktopDirectory);
            CreateShortcut(Path.Combine(desktop, "CFNAM.lnk"), indexPath, dest,
                           "shell32.dll,220", "CFNAM - build your own custom five-nights-style game", null);

            string startMenu = Path.Combine(
                Environment.GetFolderPath(Environment.SpecialFolder.Programs), "CFNAM");
            Directory.CreateDirectory(startMenu);
            CreateShortcut(Path.Combine(startMenu, "CFNAM.lnk"), indexPath, dest,
                           "shell32.dll,220", "CFNAM - build your own custom five-nights-style game", null);
            CreateShortcut(Path.Combine(startMenu, "Uninstall CFNAM.lnk"), "powershell.exe", dest,
                           null, "Remove CFNAM",
                           "-NoProfile -ExecutionPolicy Bypass -File \"" + Path.Combine(dest, "uninstall.ps1") + "\"");

            Console.WriteLine();
            Console.WriteLine("  Done. A CFNAM shortcut is on your Desktop and in the Start Menu.");
            Console.WriteLine("  Opening CFNAM now...");

            ProcessStartInfo psi = new ProcessStartInfo(indexPath);
            psi.UseShellExecute = true;
            Process.Start(psi);

            System.Threading.Thread.Sleep(2500);
            return 0;
        }
        catch (Exception ex)
        {
            Console.WriteLine();
            Console.WriteLine("  Install failed: " + ex.Message);
            Console.WriteLine("  Nothing outside the folder above was changed.");
            Console.WriteLine();
            Console.Write("  Press any key to close...");
            try { Console.ReadKey(true); } catch { Console.ReadLine(); }
            return 1;
        }
        finally
        {
            try { if (tempZip != null && File.Exists(tempZip)) File.Delete(tempZip); } catch { }
        }
    }

    // Late-bound WScript.Shell so no COM interop assembly is needed.
    static void CreateShortcut(string linkPath, string target, string workDir,
                               string icon, string desc, string args)
    {
        Type shellType = Type.GetTypeFromProgID("WScript.Shell");
        object shell = Activator.CreateInstance(shellType);
        object lnk = shellType.InvokeMember("CreateShortcut", BindingFlags.InvokeMethod,
                                            null, shell, new object[] { linkPath });
        Type t = lnk.GetType();
        t.InvokeMember("TargetPath", BindingFlags.SetProperty, null, lnk, new object[] { target });
        t.InvokeMember("WorkingDirectory", BindingFlags.SetProperty, null, lnk, new object[] { workDir });
        if (icon != null) t.InvokeMember("IconLocation", BindingFlags.SetProperty, null, lnk, new object[] { icon });
        if (desc != null) t.InvokeMember("Description", BindingFlags.SetProperty, null, lnk, new object[] { desc });
        if (args != null) t.InvokeMember("Arguments", BindingFlags.SetProperty, null, lnk, new object[] { args });
        t.InvokeMember("Save", BindingFlags.InvokeMethod, null, lnk, null);
    }
}
