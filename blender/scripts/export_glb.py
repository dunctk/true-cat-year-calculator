#!/usr/bin/env python3
"""Export only the cat collection as a GLB from a reviewed .blend.

blender --background blender/output/scene.blend \
  --python blender/scripts/export_glb.py -- --out blender/exports/cat.glb

Note: exporting a BLOCKOUT is for pipeline testing, not production.
"""
import argparse
import json
import os
import sys
from pathlib import Path
import bpy


def parse():
    argv=sys.argv
    argv=argv[argv.index("--")+1:] if "--" in argv else []
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument("--out",default="blender/exports/cat.glb")
    return p.parse_args(argv)


def main():
    args=parse()
    target=Path(os.path.abspath(args.out))
    target.parent.mkdir(parents=True,exist_ok=True)
    cat=bpy.data.collections.get("CHARACTER — export candidate")
    if cat is None:
        raise RuntimeError("Missing character export collection")
    rig=bpy.data.objects.get("CAT_RIG")
    if rig is None:
        raise RuntimeError("Missing CAT_RIG")
    # Reset to adult rest pose before export. Shape-key targets remain embedded
    # so the browser/agent can drive continuous age morphs.
    rig.scale=(1,1,1)
    rig.location=(0,0,0)
    head=bpy.data.objects.get("HEAD_RIG")
    if head:
        head.scale=(1,1,1)
    for name in ("CatBody","CatHead"):
        obj=bpy.data.objects.get(name)
        if obj and obj.data.shape_keys:
            for block in obj.data.shape_keys.key_blocks:
                if block.name!="Basis":
                    block.value=0.0
    bpy.ops.object.select_all(action="DESELECT")
    for obj in cat.all_objects:
        if obj.type in {"MESH","CURVE","EMPTY","ARMATURE"}:
            obj.select_set(True)
    bpy.context.view_layer.objects.active=rig
    bpy.context.view_layer.update()
    # glTF exporter uses use_selection and export_morph for Blender 4.x.
    # It may warn about unsupported Blender-only modifiers; inspect output.
    bpy.ops.export_scene.gltf(
        filepath=str(target),
        export_format="GLB",
        use_selection=True,
        export_morph=True,
        export_animations=False
    )
    print("TRUE_CAT_YEARS_GLB="+json.dumps({
        "filepath":str(target),
        "bytes":target.stat().st_size,
        "selected_objects":sum(1 for obj in cat.all_objects if obj.select_get()),
        "warning":"Check morph targets and material fidelity in a glTF viewer."
    }))


if __name__=="__main__":
    main()
