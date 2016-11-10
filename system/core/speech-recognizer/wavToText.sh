#1/bin/bash
for i in "$@"
do
case $i in
    -k=*|--key=*)
    KEY="${i#*=}"
    ;;
esac
done

#Has to be a mono flac file with 16000 bitrate
avconv -loglevel panic -analyzeduration 1 -y -i file.wav -ar 16000 -ac 1 -acodec flac file.flac

wget -q -U "Mozilla/5.0" --post-file file.flac --header "Content-Type: audio/x-flac; rate=16000" -O - "http://www.google.com/speech-api/v2/recognize?lang=en-us&client=chromium&key=${KEY}" >out.json
cat out.json

rm file.flac
rm file.wav
