document.addEventListener('DOMContentLoaded', function () {
    const loading = document.getElementById('loading');
    const contents = document.getElementById('firstpage');

    contents.style.display = 'none';

    setTimeout(function () {
        loading.style.display = 'none';
        contents.style.display = 'block';
    }, 100);
});


const cover = document.getElementById('cover');
const player = document.getElementById('miniPlayer');
const stationName = document.getElementById('stationName');
const stationCount = document.getElementById('station-count');
const RandomPlay = document.getElementById('randomplay');

// Dynamically list out radios
fetch("Links/all.json")
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok ' + response.statusText);
        }
        return response.json();
    })
    .then(data => {
        let currentPlayingStation = null;

        const genreContainers = {
            jmusic: document.querySelector('#jmusic'),
            kmusic: document.querySelector('#kmusic'),
            cmusic: document.querySelector('#cmusic'),
            nightcore: document.querySelector('#nightcore'),
            anime: document.querySelector('#anime'),
            vocaloid: document.querySelector('#vocaloid'),
            variety: document.querySelector('#variety'),
            bgm: document.querySelector('#bgm'),
            jpradio: document.querySelector('#jpradio')
        };

        const genreHTML = {
            jmusic: '', kmusic: '', cmusic: '', nightcore: '', anime: '', vocaloid: '', variety: '', bgm: '', jpradio: ''
        };

        data.forEach(station => {
            const genre = station.genre;

            const radHTML = `
                <div class="widget">
                    <img class="rad-icon" src="${station.favicon}">
                    <a href="${station.website}" target="_blank">
                        <span class="player-radio-name">${station.name}</span>
                    </a>
                    <div class="main-play-button"><i class="fas fa-play"></i></div>
                </div>
            `;
            genreHTML[genre] += radHTML;
        });

        Object.keys(genreContainers).forEach(genre => {
            genreContainers[genre].innerHTML = genreHTML[genre];
        });

        stationCount.textContent = data.length;

        document.addEventListener('click', function (event) {
            const button = event.target.closest('.main-play-button');
            if (button) {
                const parentDiv = button.closest('.widget');
                const station = data.find(st => st.name === parentDiv.querySelector('.player-radio-name').textContent);
                if (station) {
                    playStation(station, button);
                }
            }
        });

        // Random play function
        RandomPlay.addEventListener('click', function () {
            const stations = document.querySelectorAll('.widget');
            const randomIndex = Math.floor(Math.random() * stations.length);
            const playButton = stations[randomIndex].querySelector('.main-play-button');
            if (playButton) {
                playButton.click();
            }
        });

        function playStation(station, playButton) {
            document.querySelectorAll('.main-play-button').forEach(button => {
                updatePlayButtonIcon(button, button === playButton && !player.paused);
            });

            if (player.getAttribute('data-link') === station.url) {
                if (player.paused) {
                    player.play();
                    startCoverRotation();
                } else {
                    player.pause();
                    stopCoverRotation();
                }
            } else {
                player.src = station.url;
                player.play();
                cover.innerHTML = `<a href="${station.website}" target="_blank"><img id="ip" src="${station.favicon}"></a>`;
                stationName.textContent = station.name;
                player.setAttribute('data-link', station.url);
                startCoverRotation();
                currentPlayingStation = playButton;
            }
        }

        function updatePlayButtonIcon(playButton, isPlaying) {
            playButton.innerHTML = isPlaying ? '<i class="fas fa-pause"></i>' : '<i class="fas fa-play"></i>';
        }

        function startCoverRotation() {
            const coverImage = document.getElementById('ip');
            if (coverImage) {
                coverImage.classList.add('rotating');
            }
        }

        function stopCoverRotation() {
            const coverImage = document.getElementById('ip');
            if (coverImage) {
                coverImage.classList.remove('rotating');
            }
        }

        // Listen for play and pause events on the player
        player.addEventListener('play', () => {
            if (currentPlayingStation) {
                updatePlayButtonIcon(currentPlayingStation, true);
                startCoverRotation();
            }
        });

        player.addEventListener('pause', () => {
            if (currentPlayingStation) {
                updatePlayButtonIcon(currentPlayingStation, false);
                stopCoverRotation();
            }
        });
    })
    .catch(error => {
        console.error('There was a problem with the fetch operation:', error);
    });

// search site's station function
document.getElementById('sasalelesearch').addEventListener('input', function () {
    var searchTerm = this.value.toLowerCase();
    document.querySelectorAll('.widget').forEach(widget => {
        var stationName = widget.querySelector('.player-radio-name').textContent.toLowerCase();
        if (stationName.includes(searchTerm)) {
            widget.style.display = 'flex';
        } else {
            widget.style.display = 'none';
        }
    });
});

// search station with options using Radio Browser's API
const findRadioBtn = document.getElementById("radiosearch");
const searchField = document.getElementById('search-field');
const searchResultContainer = document.querySelector('.radio-result-container');
const searchResultHeader = document.querySelector('.radio-result-header');
const findradio = document.querySelector('.radioresultsdisplay');
let currentPlayingRadio = null;

function radioSearch() {
    const searchOption = document.getElementById('searchOption').value;
    const searchRadio = searchField.value.toLowerCase();
    if (searchRadio !== '' && searchOption !== 'Search by') {
        findradio.style.display = "block";
        searchResultHeader.style.display = "block";
        searchResultContainer.innerHTML = '';

        fetch(`https://de1.api.radio-browser.info/json/stations/${searchOption}/${searchRadio}`)
            .then(response => response.json())
            .then(data => {
                if (data.length > 0) {
                    searchResultHeader.textContent = `Search results for "${searchRadio}"`;
                    data.forEach(radio => {
                        const radioDiv = document.createElement('div');
                        radioDiv.classList.add('widget');
                        radioDiv.innerHTML = `
                            <img class="rad-icon" src="${radio.favicon ? radio.favicon : 'assets/radios/Unidentified2.webp'}">
                            <a class="player-radio-link" href="${radio.homepage}" target="_blank">
                                <span class="player-radio-name">${radio.name}</span>
                            </a>
                            <div class="main-play-button" id="play-${radio.stationuuid}">
                                <i class="fas fa-play"></i>
                            </div>
                        `;
                        searchResultContainer.appendChild(radioDiv);

                        // Add event listener for the play button
                        document.getElementById(`play-${radio.stationuuid}`).addEventListener('click', function () {
                            const parentDiv = this.closest('.widget');
                            const radio = data.find(st => st.name === parentDiv.querySelector('.player-radio-name').textContent);
                            playRadio(radio, this);
                        });
                    });
                } else {
                    searchResultHeader.textContent = 'No result found.';
                }
            })
            .catch(error => {
                console.error('Error fetching data:', error);
            });
    }
    searchField.value = '';
}
findRadioBtn.addEventListener('click', radioSearch);
searchField.addEventListener('keyup', function (event) {
    if (event.key === 'Enter') {
        findRadioBtn.click();
    }
});

// use same player for the radio searched
function playRadio(radio, playButton) {
    document.querySelectorAll('.main-play-button').forEach(button => {
        if (button !== playButton) {
            updatepls(button, false);
        }
    });

    if (player.getAttribute('data-link') === radio.url) {
        if (player.paused) {
            player.play();
            updatepls(playButton, true);
            startCoverRotation();
        } else {
            player.pause();
            updatepls(playButton, false);
            stopCoverRotation();
        }
    } else {
        player.src = radio.url;
        player.play();
        cover.innerHTML = `<a href="${radio.homepage}" target="_blank"><img id="ip" src="${radio.favicon}"></a>`;
        stationName.textContent = radio.name;
        player.setAttribute('data-link', radio.url);
        updatepls(playButton, true);
        startCoverRotation();
        currentPlayingRadio = playButton;
    }
}

function updatepls(playButton, isPlaying) {
    playButton.innerHTML = isPlaying ? '<i class="fas fa-pause"></i>' : '<i class="fas fa-play"></i>';
}

function startCoverRotation() {
    const coverImage = document.getElementById('ip');
    if (coverImage) {
        coverImage.classList.add('rotating');
    }
}

function stopCoverRotation() {
    const coverImage = document.getElementById('ip');
    if (coverImage) {
        coverImage.classList.remove('rotating');
    }
}

player.addEventListener('play', () => {
    if (currentPlayingRadio) {
        updatepls(currentPlayingRadio, true);
        startCoverRotation();
    }
});

player.addEventListener('pause', () => {
    if (currentPlayingRadio) {
        updatepls(currentPlayingRadio, false);
        stopCoverRotation();
    }
});

// Fetch radio station data


function goTop() {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}

var goTopButton = document.getElementById('up-button');
goTopButton.addEventListener('click', goTop);

// How long has the website been running?
var Sasalele = {
    liveTime: function (startDate) {
        var start = new Date(startDate);
        var now = new Date();
        var diff = now - start;

        var days = Math.floor(diff / (1000 * 60 * 60 * 24));
        var hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        var minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        var seconds = Math.floor((diff % (1000 * 60)) / 1000);

        document.getElementById('liveTime').innerText =
            "Operated for: " + days + " days " + hours + " hours " + minutes + " minutes " + seconds + " seconds";
    }
};

setInterval(function () {
    Sasalele.liveTime('2023/10/01');
}, 1000);

// Expand and minimize player
const togglePlayerButton = document.getElementById("togglePlayer");
const playerContainer = document.getElementById("player");
const expandIcon = document.querySelector("#togglePlayer .fa-expand");
const minimizeIcon = document.querySelector("#togglePlayer .fa-compress");

togglePlayerButton.addEventListener("click", () => {
    playerContainer.classList.toggle("minimized");
    expandIcon.classList.toggle("hidden");
    minimizeIcon.classList.toggle("hidden");
});

const ap = new APlayer({ container: document.getElementById("aplayer"), fixed: !1, mini: !1, autoplay: !1, theme: "#b7daff", loop: "all", order: "list", preload: "none", volume: .7, mutex: !0, listFolded: !1, listMaxHeight: "300px", lrcType: 3, audio: [{ name: "スカイクラッドの観測者", artist: "いとうかなこ", url: "assets/music/スカイクラッドの観測者 - 伊藤加奈子.mp3", cover: "assets/covers/スカイクラッドの観測者-伊藤加奈子.webp", lrc: "https://raw.githubusercontent.com/Mikeexe2/Sasalele-Music-Station/main/assets/lrc/%E3%82%B9%E3%82%AB%E3%82%A4%E3%82%AF%E3%83%A9%E3%83%83%E3%83%89%E3%81%AE%E8%A6%B3%E6%B8%AC%E8%80%85-%E4%BC%8A%E8%97%A4%E5%8A%A0%E5%A5%88%E5%AD%90.lrc" }, { name: "technovision", artist: "いとうかなこ", url: "assets/music/technovision - 伊藤加奈子.mp3", cover: "assets/covers/technovision-伊藤加奈子.webp", lrc: "https://raw.githubusercontent.com/Mikeexe2/Sasalele-Music-Station/main/assets/lrc/technovision-%E4%BC%8A%E8%97%A4%E5%8A%A0%E5%A5%88%E5%AD%90.lrc" }, { name: "Hacking to the Gate", artist: "いとうかなこ", url: "assets/music/Hacking to the Gate.mp3", cover: "assets/covers/HackingtotheGate-伊藤加奈子.webp", lrc: "https://raw.githubusercontent.com/Mikeexe2/Sasalele-Music-Station/main/assets/lrc/HackingtotheGate-%E4%BC%8A%E8%97%A4%E5%8A%A0%E5%A5%88%E5%AD%90.lrc" }, { name: "GATE OF STEINER (Bonus Track)", artist: "佐々木恵梨", url: "assets/music/GATE OF STEINER (Bonus Track) - 佐々木恵梨.mp3", cover: "assets/covers/GATEOFSTEINER(BonusTrack)-佐々木恵梨.webp", lrc: "https://raw.githubusercontent.com/Mikeexe2/Sasalele-Music-Station/main/assets/lrc/GATEOFSTEINER(BonusTrack)-%E4%BD%90%E3%80%85%E6%9C%A8%E6%81%B5%E6%A2%A8.lrc" }, { name: "いつもこの場所で", artist: "あやね", url: "assets/music/いつもこの場所で (一直在这个地方) - あやね.mp3", cover: "assets/covers/いつもこの場所で-あやね.webp", lrc: "https://raw.githubusercontent.com/Mikeexe2/Sasalele-Music-Station/main/assets/lrc/%E3%81%84%E3%81%A4%E3%82%82%E3%81%93%E3%81%AE%E5%A0%B4%E6%89%80%E3%81%A7-%E3%81%82%E3%82%84%E3%81%AD.lrc" }, { name: "あなたの選んだこの時を", artist: "いとうかなこ", url: "assets/music/あなたの選んだこの時を - いとうかなこ.mp3", cover: "assets/covers/あなたの選んだこの時を-いとうかなこ.webp", lrc: "https://raw.githubusercontent.com/Mikeexe2/Sasalele-Music-Station/main/assets/lrc/%E3%81%82%E3%81%AA%E3%81%9F%E3%81%AE%E9%81%B8%E3%82%93%E3%81%A0%E3%81%93%E3%81%AE%E6%99%82%E3%82%92-%E3%81%84%E3%81%A8%E3%81%86%E3%81%8B%E3%81%AA%E3%81%93.lrc" }, { name: "前前前世", artist: "RADWIMPS", url: "assets/music/前前前世.mp3", cover: "assets/covers/前前前世-RADWIMPS.webp", lrc: "https://raw.githubusercontent.com/Mikeexe2/Sasalele-Music-Station/main/assets/lrc/%E5%89%8D%E5%89%8D%E5%89%8D%E4%B8%96-RADWIMPS.lrc" }, { name: "Butter-Fly", artist: "和田光司(By コバソロ & 七穂)", url: "assets/music/Butter-Fly.mp3", cover: "assets/covers/Butter-Fly-和田光司(わだこうじ).webp", lrc: "https://raw.githubusercontent.com/Mikeexe2/Sasalele-Music-Station/main/assets/lrc/Butter-Fly-%E5%92%8C%E7%94%B0%E5%85%89%E5%8F%B8(%E3%82%8F%E3%81%A0%E3%81%93%E3%81%86%E3%81%98).lrc" }, { name: "Catch the Moment", artist: "LiSA", url: "assets/music/Catch the Moment.mp3", cover: "assets/covers/CatchtheMoment-LiSA.webp", lrc: "https://raw.githubusercontent.com/Mikeexe2/Sasalele-Music-Station/main/assets/lrc/CatchtheMoment-LiSA.lrc" }, { name: "Baby Don't Know Why", artist: "Ms.OOJA", url: "assets/music/Baby Dont Know Why.mp3", cover: "assets/covers/babydonttknowwhy-Ms.OOJA.webp", lrc: "https://raw.githubusercontent.com/Mikeexe2/Sasalele-Music-Station/main/assets/lrc/babydonttknowwhy-Ms.OOJA.lrc" }, { name: "LOSER", artist: "米津玄師", url: "assets/music/LOSER.mp3", cover: "assets/covers/LOSER-米津玄師.webp", lrc: "https://raw.githubusercontent.com/Mikeexe2/Sasalele-Music-Station/main/assets/lrc/LOSER-%E7%B1%B3%E6%B4%A5%E7%8E%84%E5%B8%AB.lrc" }, { name: "打上花火", artist: "DAOKO  米津玄師", url: "assets/music/打上花火.mp3", cover: "assets/covers/打上花火-米津玄師.webp", lrc: "https://raw.githubusercontent.com/Mikeexe2/Sasalele-Music-Station/main/assets/lrc/%E6%89%93%E4%B8%8A%E8%8A%B1%E7%81%AB-%E7%B1%B3%E6%B4%A5%E7%8E%84%E5%B8%AB.lrc" }, { name: "終わりの世界から", artist: "麻枝 准  やなぎなぎ", url: "assets/music/終わりの世界から.mp3", cover: "assets/covers/終わりの世界から-やなぎなぎ.webp", lrc: "https://raw.githubusercontent.com/Mikeexe2/Sasalele-Music-Station/main/assets/lrc/%E7%B5%82%E3%82%8F%E3%82%8A%E3%81%AE%E4%B8%96%E7%95%8C%E3%81%8B%E3%82%89-%E3%82%84%E3%81%AA%E3%81%8E%E3%81%AA%E3%81%8E.lrc" }, { name: "Break Beat Bark!", artist: "神田沙也加", url: "assets/music/Break Beat Bark.mp3", cover: "assets/covers/BreakBeatBark!-神田沙也加.webp", lrc: "https://raw.githubusercontent.com/Mikeexe2/Sasalele-Music-Station/main/assets/lrc/BreakBeatBark!-%E7%A5%9E%E7%94%B0%E6%B2%99%E4%B9%9F%E5%8A%A0.lrc" }, { name: "ワイルドローズ", artist: "May'n", url: "assets/music/Wild Rose.mp3", cover: "assets/covers/ワイルドローズ-Mayn.webp", lrc: "https://raw.githubusercontent.com/Mikeexe2/Sasalele-Music-Station/main/assets/lrc/%E3%83%AF%E3%82%A4%E3%83%AB%E3%83%89%E3%83%AD%E3%83%BC%E3%82%BA-Mayn.lrc" }, { name: "My Days", artist: "鈴木このみ", url: "assets/music/My Days.mp3", cover: "assets/covers/MyDays-鈴木このみ.webp", lrc: "assets/lrc/MyDays-鈴木このみ.lrc" }, { name: "Lemon", artist: "米津玄師", url: "assets/music/Lemon.mp3", cover: "assets/covers/Lemon-米津玄師.webp", lrc: "https://raw.githubusercontent.com/Mikeexe2/Sasalele-Music-Station/main/assets/lrc/Lemon-%E7%B1%B3%E6%B4%A5%E7%8E%84%E5%B8%AB.lrc" }, { name: "小さな恋のうた", artist: "コバソロ & 杏沙子", url: "assets/music/小さな恋のうた.mp3", cover: "assets/covers/コバソロ.webp", lrc: "https://raw.githubusercontent.com/Mikeexe2/Sasalele-Music-Station/main/assets/lrc/%E5%B0%8F%E3%81%95%E3%81%AA%E6%81%8B%E3%81%AE%E3%81%86%E3%81%9F-Kobasolo(%E3%82%B3%E3%83%90%E3%82%BD%E3%83%AD)%E4%B8%83%E7%A9%82.lrc" }, { name: "あとひとつ", artist: "コバソロ & こぴ", url: "assets/music/あとひとつ.mp3", cover: "assets/covers/コバソロ.webp", lrc: "https://raw.githubusercontent.com/Mikeexe2/Sasalele-Music-Station/main/assets/lrc/%E3%81%82%E3%81%A8%E3%81%B2%E3%81%A8%E3%81%A4-Kobasolo(%E3%82%B3%E3%83%90%E3%82%BD%E3%83%AD)%E3%81%93%E3%81%B4.lrc" }, { name: "キセキ", artist: "高橋李依", url: "assets/music/キセキ.mp3", cover: "assets/covers/高橋李依Collection.webp", lrc: "https://raw.githubusercontent.com/Mikeexe2/Sasalele-Music-Station/main/assets/lrc/%E3%82%AD%E3%82%BB%E3%82%AD-%E9%AB%98%E6%A9%8B%E6%9D%8E%E4%BE%9D.lrc" }, { name: "小さな恋のうた", artist: "高橋李依", url: "assets/music/小さな恋のうた_高橋李依.mp3", cover: "assets/covers/高橋李依Collection.webp", lrc: "https://raw.githubusercontent.com/Mikeexe2/Sasalele-Music-Station/main/assets/lrc/%E5%B0%8F%E3%81%95%E3%81%AA%E6%81%8B%E3%81%AE%E3%81%86%E3%81%9F-%E9%AB%98%E6%A9%8B%E6%9D%8E%E4%BE%9D.lrc" }, { name: "言わないけどね。", artist: "高橋李依", url: "assets/music/言わないけどね。.mp3", cover: "assets/covers/高橋李依Collection.webp", lrc: "https://raw.githubusercontent.com/Mikeexe2/Sasalele-Music-Station/main/assets/lrc/%E8%A8%80%E3%82%8F%E3%81%AA%E3%81%84%E3%81%91%E3%81%A9%E3%81%AD%E3%80%82-%E9%AB%98%E6%A9%8B%E6%9D%8E%E4%BE%9D.lrc" }, { name: "愛唄", artist: "高橋李依", url: "assets/music/愛唄.mp3", cover: "assets/covers/高橋李依Collection.webp", lrc: "https://raw.githubusercontent.com/Mikeexe2/Sasalele-Music-Station/main/assets/lrc/%E6%84%9B%E5%94%84-%E9%AB%98%E6%A9%8B%E6%9D%8E%E4%BE%9D.lrc" }, { name: "奏(和聲版)", artist: "高橋李依 x 雨宫天", url: "assets/music/奏.mp3", cover: "assets/covers/高橋李依Collection.webp", lrc: "https://raw.githubusercontent.com/Mikeexe2/Sasalele-Music-Station/main/assets/lrc/%E5%A5%8F(%E3%81%8B%E3%81%AA%E3%81%A7)-%E9%AB%98%E6%A9%8B%E6%9D%8E%E4%BE%9D.lrc" }, { name: "生きていたんだよな", artist: "あいみょん", url: "assets/music/生きていたんだよな.mp3", cover: "assets/covers/生きていたんだよな-あいみょん.webp", lrc: "assets/lrc/生きていたんだよな-あいみょん.lrc" }, { name: "空の青さを知る人よ", artist: "あいみょん", url: "assets/music/空の青さを知る人よ.mp3", cover: "assets/covers/空の青さを知る人よ-あいみょん.webp", lrc: "https://raw.githubusercontent.com/Mikeexe2/Sasalele-Music-Station/main/assets/lrc/%E7%A9%BA%E3%81%AE%E9%9D%92%E3%81%95%E3%82%92%E7%9F%A5%E3%82%8B%E4%BA%BA%E3%82%88-%E3%81%82%E3%81%84%E3%81%BF%E3%82%87%E3%82%93.lrc" }, { name: "心做し", artist: "鹿乃", url: "assets/music/鹿乃 - 心做し.mp3", cover: "assets/covers/心做し-鹿乃.webp", lrc: "https://raw.githubusercontent.com/Mikeexe2/Sasalele-Music-Station/main/assets/lrc/%E5%BF%83%E5%81%9A%E3%81%97-%E9%B9%BF%E4%B9%83.lrc" }, { name: "あの世行きのバスに乗ってさらば。", artist: "ツユ", url: "assets/music/あの世行きのバスに乗ってさらば。.mp3", cover: "assets/covers/あの世行きのバスに乗ってさらば。-ツユ.webp", lrc: "https://raw.githubusercontent.com/Mikeexe2/Sasalele-Music-Station/main/assets/lrc/%E3%81%82%E3%81%AE%E4%B8%96%E8%A1%8C%E3%81%8D%E3%81%AE%E3%83%90%E3%82%B9%E3%81%AB%E4%B9%97%E3%81%A3%E3%81%A6%E3%81%95%E3%82%89%E3%81%B0%E3%80%82-%E3%83%84%E3%83%A6.lrc" }, { name: "願い～あの頃のキミへ～", artist: "當山みれい", url: "assets/music/願い～あの頃のキミへ～.mp3", cover: "assets/covers/願いあの頃のキミへ-當山みれい..webp", lrc: "https://raw.githubusercontent.com/Mikeexe2/Sasalele-Music-Station/main/assets/lrc/%E9%A1%98%E3%81%84%E3%81%82%E3%81%AE%E9%A0%83%E3%81%AE%E3%82%AD%E3%83%9F%E3%81%B8-%E7%95%B6%E5%B1%B1%E3%81%BF%E3%82%8C%E3%81%84.lrc" }, { name: "茜さす", artist: "Aimer", url: "assets/music/茜さす.mp3", cover: "assets/covers/茜さす-Aimer.webp", lrc: "https://raw.githubusercontent.com/Mikeexe2/Sasalele-Music-Station/main/assets/lrc/%E8%8C%9C%E3%81%95%E3%81%99-Aimer.lrc" }, { name: "Rain", artist: "秦基博(はたもとひろ)", url: "assets/music/Rain.mp3", cover: "assets/covers/Rain-秦基博(はたもとひろ).webp", lrc: "https://raw.githubusercontent.com/Mikeexe2/Sasalele-Music-Station/main/assets/lrc/Rain-%E7%A7%A6%E5%9F%BA%E5%8D%9A(%E3%81%AF%E3%81%9F%E3%82%82%E3%81%A8%E3%81%B2%E3%82%8D).lrc" }, { name: "remember", artist: "Uru", url: "assets/music/remember.mp3", cover: "assets/covers/remember-uru.webp", lrc: "https://raw.githubusercontent.com/Mikeexe2/Sasalele-Music-Station/main/assets/lrc/remember-uru.lrc" }, { name: "AI DO.", artist: "桥本美雪", url: "assets/music/AI DO. - 桥本美雪.mp3", cover: "assets/covers/AIDO.-桥本美雪.webp", lrc: "assets/lrc/AIDO.-桥本美雪.lrc" }, { name: "Apple And Cinnamon", artist: "宇多田ヒカル", url: "assets/music/Apple And Cinnamon - 宇多田ヒカル.mp3", cover: "assets/covers/AppleAndCinnamon-宇多田ヒカル.webp", lrc: "https://raw.githubusercontent.com/Mikeexe2/Sasalele-Music-Station/main/assets/lrc/AppleAndCinnamon-%E5%AE%87%E5%A4%9A%E7%94%B0%E3%83%92%E3%82%AB%E3%83%AB.lrc" }, { name: "Keep on Keeping on", artist: "SawanoHiroyuki[nZk],aLIEz.", url: "assets/music/Keep on Keeping on - SawanoHiroyuki[nZk],aLIEz.mp3", cover: "assets/covers/KeeponKeepingon-SawanoHiroyuki_aLIEz.webp", lrc: "https://raw.githubusercontent.com/Mikeexe2/Sasalele-Music-Station/main/assets/lrc/KeeponKeepingon-SawanoHiroyuki_aLIEz.lrc" }, { name: "loser", artist: "KANA-BOON", url: "assets/music/loser - KANA-BOON.mp3", cover: "assets/covers/loser-KANA-BOON.webp", lrc: "https://raw.githubusercontent.com/Mikeexe2/Sasalele-Music-Station/main/assets/lrc/loser-KANA-BOON.lrc" }, { name: "Moon", artist: "Perfume", url: "assets/music/Moon - Perfume.mp3", cover: "assets/covers/Moon-Perfume.webp", lrc: "https://raw.githubusercontent.com/Mikeexe2/Sasalele-Music-Station/main/assets/lrc/Moon-Perfume.lrc" }, { name: "MOON SIGNAL", artist: "Sphere", url: "assets/music/MOON SIGNAL - Sphere.mp3", cover: "assets/covers/MOONSIGNAL-Sphere.webp", lrc: "https://raw.githubusercontent.com/Mikeexe2/Sasalele-Music-Station/main/assets/lrc/MOONSIGNAL-Sphere.lrc" }, { name: "One Life", artist: "ナノ", url: "assets/music/One Life - ナノ.mp3", cover: "assets/covers/OneLife-ナノ.webp", lrc: "https://raw.githubusercontent.com/Mikeexe2/Sasalele-Music-Station/main/assets/lrc/OneLife-%E3%83%8A%E3%83%8E.lrc" }, { name: "メビウス", artist: "鈴木このみ", url: "assets/music/メビウス (梅比乌斯) - 鈴木このみ.mp3", cover: "assets/covers/メビウス(梅比乌斯)-鈴木このみ.webp", lrc: "https://raw.githubusercontent.com/Mikeexe2/Sasalele-Music-Station/main/assets/lrc/%E3%83%A1%E3%83%93%E3%82%A6%E3%82%B9(%E6%A2%85%E6%AF%94%E4%B9%8C%E6%96%AF)-%E9%88%B4%E6%9C%A8%E3%81%93%E3%81%AE%E3%81%BF.lrc" }, { name: "Damn Good Day", artist: "星街すいせい", url: "assets/music/Damn Good Day - 星街すいせい.mp3", cover: "assets/covers/DamnGoodDay-星街すいせい.webp", lrc: "https://raw.githubusercontent.com/Mikeexe2/Sasalele-Music-Station/main/assets/lrc/DamnGoodDay-%E6%98%9F%E8%A1%97%E3%81%99%E3%81%84%E3%81%9B%E3%81%84.lrc" }, { name: "Necro Fantasia feat. 美里", artist: "Alstroemeria Records,美里", url: "assets/music/Necro Fantasia feat. 美里 - Alstroemeria Records,美里.mp3", cover: "assets/covers/NecroFantasiafeat.美里-AlstroemeriaRecords_美里.webp", lrc: "https://raw.githubusercontent.com/Mikeexe2/Sasalele-Music-Station/main/assets/lrc/NecroFantasiafeat.%E7%BE%8E%E9%87%8C-AlstroemeriaRecords_%E7%BE%8E%E9%87%8C.lrc" }, { name: "ぐらでーしょん", artist: "KANA-BOON,北澤ゆうほ", url: "assets/music/ぐらでーしょん (波淡法) - KANA-BOON,北澤ゆうほ.mp3", cover: "assets/covers/ぐらでーしょん-KANA-BOON,北澤ゆうほ.webp", lrc: "https://raw.githubusercontent.com/Mikeexe2/Sasalele-Music-Station/main/assets/lrc/%E3%81%90%E3%82%89%E3%81%A7%E3%83%BC%E3%81%97%E3%82%87%E3%82%93-KANA-BOON%2C%E5%8C%97%E6%BE%A4%E3%82%86%E3%81%86%E3%81%BB.lrc" }, { name: "チョ・イ・ス", artist: "雨宮天", url: "assets/music/チョ・イ・ス - 雨宮天.mp3", cover: "assets/covers/チョ・イ・ス-雨宮天.webp", lrc: "https://raw.githubusercontent.com/Mikeexe2/Sasalele-Music-Station/main/assets/lrc/%E3%83%81%E3%83%A7%E3%83%BB%E3%82%A4%E3%83%BB%E3%82%B9-%E9%9B%A8%E5%AE%AE%E5%A4%A9.lrc" }, { name: "ひかり", artist: "Flower Flower", url: "assets/music/ひかり - Flower Flower.mp3", cover: "assets/covers/ひかり-FlowerFlower.webp", lrc: "https://raw.githubusercontent.com/Mikeexe2/Sasalele-Music-Station/main/assets/lrc/%E3%81%B2%E3%81%8B%E3%82%8A-FlowerFlower.lrc" }, { name: "人形ノ涙", artist: "仲村芽衣子", url: "assets/music/人形ノ涙 - 仲村芽衣子.mp3", cover: "assets/covers/人形ノ涙-仲村芽衣子.webp", lrc: "https://raw.githubusercontent.com/Mikeexe2/Sasalele-Music-Station/main/assets/lrc/%E4%BA%BA%E5%BD%A2%E3%83%8E%E6%B6%99-%E4%BB%B2%E6%9D%91%E8%8A%BD%E8%A1%A3%E5%AD%90.lrc" }, { name: "喋蝶結び", artist: "ななひら", url: "assets/music/喋蝶結び - ななひら.mp3", cover: "assets/covers/喋蝶結び-ななひら.webp", lrc: "https://raw.githubusercontent.com/Mikeexe2/Sasalele-Music-Station/main/assets/lrc/%E5%96%8B%E8%9D%B6%E7%B5%90%E3%81%B3-%E3%81%AA%E3%81%AA%E3%81%B2%E3%82%89.lrc" }, { name: "月に唄えば", artist: "サイダーガール", url: "assets/music/月に唄えば - サイダーガール.mp3", cover: "assets/covers/月に唄えば-サイダーガール.webp", lrc: "https://raw.githubusercontent.com/Mikeexe2/Sasalele-Music-Station/main/assets/lrc/%E6%9C%88%E3%81%AB%E5%94%84%E3%81%88%E3%81%B0-%E3%82%B5%E3%82%A4%E3%83%80%E3%83%BC%E3%82%AC%E3%83%BC%E3%83%AB.lrc" }, { name: "甘いワナ ~Paint It, Black", artist: "宇多田ヒカル", url: "assets/music/甘いワナ ~Paint It, Black - 宇多田ヒカル.mp3", cover: "assets/covers/甘いワナPaintItBlack-宇多田ヒカル.webp", lrc: "https://raw.githubusercontent.com/Mikeexe2/Sasalele-Music-Station/main/assets/lrc/%E7%94%98%E3%81%84%E3%83%AF%E3%83%8APaintItBlack-%E5%AE%87%E5%A4%9A%E7%94%B0%E3%83%92%E3%82%AB%E3%83%AB.lrc" }, { name: "廻廻奇譚", artist: "Eve", url: "assets/music/廻廻奇譚 - Eve.mp3", cover: "assets/covers/廻廻奇譚-Eve.webp", lrc: "https://raw.githubusercontent.com/Mikeexe2/Sasalele-Music-Station/main/assets/lrc/%E5%BB%BB%E5%BB%BB%E5%A5%87%E8%AD%9A-Eve.lrc" }, { name: "足りない音はキミの声", artist: "諸星すみれ", url: "assets/music/足りない音はキミの声 - 諸星すみれ.mp3", cover: "assets/covers/足りない音はキミの声-諸星すみれ.webp", lrc: "https://raw.githubusercontent.com/Mikeexe2/Sasalele-Music-Station/main/assets/lrc/%E8%B6%B3%E3%82%8A%E3%81%AA%E3%81%84%E9%9F%B3%E3%81%AF%E3%82%AD%E3%83%9F%E3%81%AE%E5%A3%B0-%E8%AB%B8%E6%98%9F%E3%81%99%E3%81%BF%E3%82%8C.lrc" }] });