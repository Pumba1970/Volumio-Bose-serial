# Bose Lifestyle 18 RS232 Control (Volumio 3 Plugin)

Control your Bose Lifestyle 18 system via RS232 from your Volumio 3 device.

## Features

- Power on/off
- Volume up/down (Room A & B)
- Mute/unmute (Room A & B)
- Source selection (AUX, Room A & B)
- Serial port configuration via the Volumio UI

## Installation

1. **Maak een plugin map aan op je Volumio device:**
    ```sh
    mkdir -p /data/plugins/miscellanea/bose_rs232_control
    cd /data/plugins/miscellanea/bose_rs232_control
    ```
2. **Plaats alle bestanden uit deze repository in deze map.**
3. **Installeer de dependencies:**
    ```sh
    npm install
    ```
4. **Herstart Volumio of activeer de plugin via de Volumio UI.**
5. **Configureer het juiste pad naar je seriële poort in de plugin instellingen.**

## RS232 Kabel & Instellingen

- Standaard baudrate: **9600**, databits: **8**, stopbits: **1**, parity: **none**
- Controleer of je de juiste kabel (straight-through of null-modem) gebruikt

## Veelgestelde vragen

- **Permission denied op de seriële poort?**
  Voeg de `volumio` gebruiker toe aan de `dialout` groep:
  ```sh
  sudo usermod -a -G dialout volumio
  sudo reboot
  ```

## RS232 Commando's

| Actie               | Room | Commando (Hex)            |
|---------------------|------|---------------------------|
| Power On            |  -   | 4D 4D 4A 41 01            |
| Power Off           |  -   | 4D 4D 4A 43 01            |
| Volume +            |  A   | 4D 4D 44 41 00            |
| Volume -            |  A   | 4D 4D 44 42 00            |
| Volume +            |  B   | 4D 4D 44 41 01            |
| Volume -            |  B   | 4D 4D 44 42 01            |
| Mute                |  A   | 4D 4D 43 41 01            |
| Unmute              |  A   | 4D 4D 43 40 01            |
| Mute                |  B   | 4D 4D 43 41 02            |
| Unmute              |  B   | 4D 4D 43 40 02            |
| Source → AUX        |  A   | 4D 4D 42 40 01 03         |
| Source → AUX        |  B   | 4D 4D 42 40 02 03         |

## Licentie

GPL-3.0

---

*Plugin ontwikkeld met ❤️ voor de Bose Lifestyle 18 en Volumio community.*
