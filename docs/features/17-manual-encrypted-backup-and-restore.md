# 17. Manwal at Nakatagong Backup at Restore (Manual Encrypted Backup and Restore)

> Phase: Sa Haharapin (Later)

## Problema

Ang buong negosyo ng tindahan ay nakatira sa iisang telepono. Kapag ang telepono ay nawala, nasira, nanakaw, o pinalitan, mawawala ang lahat: catalog, kasaysayan ng benta, mga balanse ng suki, lahat nito. Ang may-ari ay nakarinig ng mga kwento ng takot mula sa ibang may-ari ng tindahan na nawalan ng kanilang mga libro. Gusto nila ng paraan upang mag-back up, ngunit ayaw nilang gumawa ng cloud account, ayaw nilang ang kanilang sales data ay ma-upload sa server na hindi nila nakikita, at ayaw nila ng auto-sync na hindi nila hiningi.

## Kuwento ng Gumagamit (User Story)

Bilang may-ari ng tindahan, gusto kong manwal na mag-back up ng buong lokal na database sa isang file na kontrolado ko, at mag-restore mula sa file na iyon sa bagong aparato, upang ang aking negosyo ay mabuhay sa pagkawala ng telepono nang hindi isinusuko ang kontrol sa aking data.

## Kasama sa Saklaw (In Scope)

- Isang "Backup" action sa Settings na gumagawa ng iisang encrypted file na naglalaman ng buong SQLite database.
- Ang file ay ina-export sa pamamagitan ng native share / Files flow ng aparato (upang mai-save ng may-ari sa lokal na storage, USB drive, o anumang cloud destination na pinagkakatiwalaan na nila).
- Ang encryption key ay nagmumula sa passphrase na itinatakda ng may-ari sa oras ng backup (at muling ipinapasok sa oras ng restore). Walang key escrow, walang server-side recovery.
- Isang "Restore" action na nagbabasa ng backup file, nagva-validate ng encryption, at nagpapalit sa kasalukuyang database. Ang restore ay destructive; kailangang kumpirmahin ng may-ari.
- Isang "Restore to new device" onboarding path para sa bagong aparato na wala pang umiiral na data — inilalaktawan nito ang destructive step at nag-i-import lamang.

## Hindi Kasama sa Saklaw (Out of Scope)

- Automatic o scheduled backups. Manual lamang.
- Cloud sync, account-based recovery, o anumang server component.
- Incremental o differential backups. Ang unang bersyon ay buong snapshot bawat pagkakataon.

## Mga Implikasyon sa Data (Data Implications)

- Ang backup ay ang SQLite file. Walang bagong talahanayan. Ang bagong module (hal. `lib/backup.ts`) ang humahawak sa packaging ng file, encryption, at decryption.
- Ang encryption ay kailangang gumamit ng vetted algorithm (AES-GCM na may passphrase-derived key via Argon2 o scrypt).
- Ang WAL at SHM side-files ng SQLite file ay kailangang i-checkpoint bago mag-backup upang maiwasan ang hindi tugmang export.
- Restore: ang import ay kailangang tumakbo sa isang tahimik na database (walang bukas na transaksyon, walang in-flight queries).
- Walang migration sa database. Ang backup ay opaque.

## Mga Dependency (Dependencies)

- Wala sa data layer.
- Dapat idisenyo kasabay ng dev reset path (`app/(tabs)/dev/reset.tsx`).

## Mga Open Question

- Saan nangyayari ang encryption — sa JS o sa native module?
- Ano ang format ng backup file? Isang encrypted file na naglalaman ng SQLite snapshot, plus maliit na unencrypted header na may bersyon at schema version.
- Ang "Restore" ba ay idempotent? Ang pagpapalit sa active database ay destructive.

## Mga Tala sa Pagiging Posible (Feasibility Notes)

- Ito ay isang security-sensitive na tampok. Ang pagpili ng encryption ay dapat sumunod sa patakarang "gumamit ng vetted library, huwag mag-hand-roll".
- Ang passphrase-derived key ang tamang modelo: ang may-ari ang nagkokontrol kung sino ang makakabasa sa backup. Walang recovery kung mawala ang passphrase.
- Performance: ang isang taong data ng sari-sari store ay maliit (ilang MBs lamang); ang oras ng encryption ay katanggap-tanggap.
