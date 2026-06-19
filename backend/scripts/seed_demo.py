"""插入示例数据，用于前端演示（不调用 AI API）。"""

import shutil
from pathlib import Path

from app.config import get_settings
from app.database import SessionLocal
from app.models import Scene, Segment, Work

settings = get_settings()

DEMO_SEGMENTS = [
    {
        "start": 0.0,
        "end": 4.5,
        "speaker": "祝英台",
        "wu": "梁兄，侬看搿座桥，像勿像我们俩一道读书个学堂？",
        "mandarin": "梁兄，你看这座桥，像不像我们一起读书的学堂？",
        "english": "Brother Liang, look at this bridge—doesn't it resemble the school where we studied together?",
        "notes": "吴语中“侬”意为“你”。",
    },
    {
        "start": 4.8,
        "end": 9.2,
        "speaker": "梁山伯",
        "wu": "像倒是像，可惜伊搭只通男女，勿通同窗之情。",
        "mandarin": "倒是像，可惜这里只通男女，不通同窗之情。",
        "english": "It does, but alas, this place only joins man and woman, not the bond of schoolmates.",
        "notes": "",
    },
    {
        "start": 9.5,
        "end": 14.0,
        "speaker": "祝英台",
        "wu": "梁兄啊，英台有一桩心事，今朝定规要告诉侬。",
        "mandarin": "梁兄，英台有一件心事，今天一定要告诉你。",
        "english": "Brother Liang, Yingtai has a secret she must tell you today.",
        "notes": "",
    },
    {
        "start": 14.3,
        "end": 18.5,
        "speaker": "梁山伯",
        "wu": "贤弟请讲，山伯洗耳恭听。",
        "mandarin": "贤弟请讲，山伯洗耳恭听。",
        "english": "Please speak, my dear friend. I am all ears.",
        "notes": "",
    },
    {
        "start": 18.8,
        "end": 25.0,
        "speaker": "祝英台",
        "wu": "其实……英台勿是男儿身，伊是一个小女子。",
        "mandarin": "其实……英台不是男儿身，她是一个小女子。",
        "english": "The truth is... Yingtai is not a man, but a young woman.",
        "notes": "",
    },
]

DEMO_SCENES = [
    {
        "title": "十八相送",
        "start": 0.0,
        "end": 9.0,
        "background": "梁山伯送别祝英台归家，二人同行至桥头。祝英台多次借物喻情，暗示自己是女儿身，梁山伯却未能领会。",
    },
    {
        "title": "楼台表白",
        "start": 9.0,
        "end": 25.0,
        "background": "祝英台下定决心，在楼台之上向梁山伯坦白真实身份。这一刻是悲剧爱情的高潮起点。",
    },
]

SUMMARY = "《梁山伯与祝英台》是中国四大民间爱情传说之一。祝英台女扮男装与梁山伯同窗三年，感情深厚。归家途中英台多次暗示身份，山伯不解。最终英台被迫许配他人，山伯病逝，英台殉情，双双化蝶。"

CHARACTERS = [
    {"name": "梁山伯", "description": "忠厚善良的书生，祝英台的同窗与恋人。"},
    {"name": "祝英台", "description": "机智勇敢的女子，女扮男装求学，深爱梁山伯。"},
]


def main() -> None:
    db = SessionLocal()
    try:
        existing = db.query(Work).filter(Work.title == "演示片段：楼台会（示例数据）").first()
        if existing:
            print(f"Demo work already exists: id={existing.id}")
            return

        work_dir = Path(settings.upload_dir) / "works" / "demo"
        work_dir.mkdir(parents=True, exist_ok=True)
        media_path = work_dir / "demo.mp3"
        # 复制一个静音音频作为占位
        silent_src = Path("/tmp/silent.mp3")
        if silent_src.exists():
            shutil.copy(silent_src, media_path)
        else:
            media_path.write_bytes(b"")

        work = Work(
            title="演示片段：楼台会（示例数据）",
            description="本条目为示例数据，用于展示前端三语字幕、场景解析与剧情梗概效果，不调用真实 AI 解析。",
            media_path=str(media_path),
            audio_path=str(media_path),
            duration_seconds=25.0,
            status="completed",
            summary=SUMMARY,
            characters=CHARACTERS,
        )
        db.add(work)
        db.commit()
        db.refresh(work)

        for ds in DEMO_SEGMENTS:
            db.add(
                Segment(
                    work_id=work.id,
                    start_seconds=ds["start"],
                    end_seconds=ds["end"],
                    speaker=ds["speaker"],
                    wu_text=ds["wu"],
                    mandarin_text=ds["mandarin"],
                    english_text=ds["english"],
                    notes=ds["notes"] or None,
                )
            )

        for ds in DEMO_SCENES:
            db.add(
                Scene(
                    work_id=work.id,
                    start_seconds=ds["start"],
                    end_seconds=ds["end"],
                    title=ds["title"],
                    background=ds["background"],
                )
            )

        db.commit()
        print(f"Created demo work with id={work.id}")
    finally:
        db.close()


if __name__ == "__main__":
    main()
