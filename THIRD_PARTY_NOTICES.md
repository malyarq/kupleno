# Сторонние компоненты

## PDF.js

- проект: [Mozilla PDF.js](https://github.com/mozilla/pdf.js);
- пакет: `pdfjs-dist@5.6.205`;
- исходные файлы пакета: `legacy/build/pdf.min.mjs` и `legacy/build/pdf.worker.min.mjs`;
- файлы в MarketTrat: `extension/vendor/pdf.mjs` и `extension/vendor/pdf.worker.mjs`;
- лицензия: Apache License 2.0, копия в `LICENSES/Apache-2.0.txt`.

Зафиксированные SHA-256:

```text
0d29c4871eff0b72f3896825f2673ddf7dfbccf815a7095a5d14f5aa68fab0e5  extension/vendor/pdf.mjs
7fc442c268d107d656755252cf38c422a88e825b7f0caaac6a5f58364dff4179  extension/vendor/pdf.worker.mjs
```

Оба файла сверены с официальным npm-архивом `pdfjs-dist-5.6.205.tgz` с integrity:

```text
sha512-tlUj+2IDa7G1SbvBNN74UHRLJybZDWYom+k6p5KIZl7huBvsA4APi6mKL+zCxd3tLjN5hOOEE9Tv7VdzO88pfg==
```

Локальная проверка выполняется командой:

```sh
./scripts/check-vendored-dependencies.sh
```

При обновлении PDF.js нужно заменить оба файла одной версией, обновить лицензию при необходимости, SHA-256 в этом документе и скрипте, затем пройти полный `npm run verify`.
