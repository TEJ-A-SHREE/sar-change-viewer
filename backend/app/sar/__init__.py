"""SAR processing pipeline.

Each module owns one stage and exposes plain functions that take and return
numpy arrays or paths. Keep them free of FastAPI imports so they can be used
from notebooks and scripts too.

    fetch.py      -> get scenes for a bbox + date         (data team)
    process.py    -> calibrate, filter, compute change     (processing team)
    visualize.py  -> turn arrays into PNGs with matplotlib (visualisation team)
    analyze.py    -> turn numbers into plain-language text (analysis team)
"""
