#!/usr/bin/env python3
"""Render the four age checkpoints from a saved, hand-refined .blend scene.

blender --background blender/output/scene.blend \
  --python blender/scripts/render_checkpoints.py -- --output-dir blender/renders

Does not rebuild or save over your editable .blend.
"""
import argparse
import json
import math
import os
import sys
from pathlib import Path
import bpy

MAX_AGE = 38 + 3 / 365.2425


def smooth(a, b, x):
    t = min(1.0, max(0.0, (x-a)/(b-a)))
    return t*t*(3-2*t)


def arguments():
    argv=sys.argv
    argv=argv[argv.index("--")+1:] if "--" in argv else []
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output-dir",default="blender/renders")
    parser.add_argument("--size",type=int,default=1024)
    return parser.parse_args(argv)


def set_age(cat_age):
    root=bpy.data.objects["CAT_RIG"]
    age=min(MAX_AGE,max(0.0,float(cat_age)))
    grow=smooth(0,2.5,age)
    kitten=1-smooth(.2,3.25,age)
    senior=smooth(12,33,age)
    size=.43+.57*grow
    root.scale=(size,size,size)
    root.location=(0,0,0)
    root["cat_age"]=age
    head=bpy.data.objects.get("HEAD_RIG")
    if head:
        head.scale=(1+.13*kitten,1+.09*kitten,1+.10*kitten)
    for name in ("CatHead","CatBody"):
        mesh=bpy.data.objects.get(name)
        if mesh and mesh.data.shape_keys:
            keys=mesh.data.shape_keys.key_blocks
            if "Age_Kitten" in keys:
                keys["Age_Kitten"].value=kitten
            if "Age_Senior" in keys:
                keys["Age_Senior"].value=senior
    # Designer can replace or extend this material pipeline later.
    mat=bpy.data.materials.get("Cat Fur | warm cream matte")
    if mat and mat.use_nodes:
        base=(.89,.81,.70,1.0)
        silver=(.69,.72,.71,1.0)
        elder=smooth(20,MAX_AGE,age)
        fraction=.44*senior+.26*elder
        tint=tuple(a+(b-a)*fraction for a,b in zip(base,silver))
        node=next((x for x in mat.node_tree.nodes if x.type=="BSDF_PRINCIPLED"),None)
        if node:
            node.inputs["Base Color"].default_value=tint
        mat.diffuse_color=tint
    bpy.context.view_layer.update()


def main():
    opt=arguments()
    out=Path(os.path.abspath(os.path.expanduser(opt.output_dir)))
    out.mkdir(parents=True,exist_ok=True)
    assert bpy.data.objects.get("CAT_RIG"), "Missing CAT_RIG from scene"
    assert bpy.context.scene.camera, "Set a camera first"
    bpy.context.scene.render.resolution_x=opt.size
    bpy.context.scene.render.resolution_y=opt.size
    bpy.context.scene.render.resolution_percentage=100
    files=[]
    for age in (0,2,10,25):
        set_age(age)
        destination=out/("age-%02d.png"%age)
        bpy.context.scene.render.filepath=str(destination)
        bpy.ops.render.render(write_still=True)
        files.append(str(destination))
    print("TRUE_CAT_YEARS_RENDERS="+json.dumps(files))
    # Do not save: source .blend remains as sculpted and manually staged.


if __name__=="__main__":
    main()
