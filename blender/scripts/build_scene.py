#!/usr/bin/env python3
"""
True Cat Years: a reproducible Blender character BLOCKOUT, not finished artwork.

Run from repository root using Blender 4.2+:
    blender --background --python blender/scripts/build_scene.py -- \
      --output-dir blender/output
    blender --background --python blender/scripts/build_scene.py -- \
      --output-dir blender/output --skip-renders

Produces scene.blend and optionally four matched-camera PNGs. No third-party
Python dependencies, internet, cloud APIs or assets. See ../AGENT_BRIEF.md.
"""
import argparse
import json
import math
import os
import sys
from pathlib import Path

import bpy
from mathutils import Vector

CAT_MAX = 38 + 3 / 365.2425
FUR = (0.89, 0.81, 0.70, 1)
SILVER = (0.69, 0.72, 0.71, 1)
CREAM = (0.96, 0.89, 0.81, 1)
PINK = (0.69, 0.36, 0.48, 1)
INK = (0.20, 0.27, 0.34, 1)
JADE = (0.45, 0.69, 0.62, 1)
GOLD = (0.85, 0.65, 0.38, 1)


def args():
    argv = sys.argv
    mine = argv[argv.index("--") + 1:] if "--" in argv else []
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output-dir", default="blender/output")
    parser.add_argument("--skip-renders", action="store_true")
    parser.add_argument("--size", type=int, default=900)
    return parser.parse_args(mine)


def smooth(a, b, x):
    t = min(1, max(0, (x - a) / (b - a)))
    return t * t * (3 - 2 * t)


def lerp(a, b, t):
    return a + (b - a) * t


def make_material(name, rgba, roughness=0.92):
    m = bpy.data.materials.new(name)
    m.diffuse_color = rgba
    m.use_nodes = True
    bsdf = next(n for n in m.node_tree.nodes if n.type == "BSDF_PRINCIPLED")
    bsdf.inputs["Base Color"].default_value = rgba
    bsdf.inputs["Roughness"].default_value = roughness
    bsdf.inputs["Metallic"].default_value = 0
    return m


def collect(name):
    c = bpy.data.collections.new(name)
    bpy.context.scene.collection.children.link(c)
    return c


def object_to_collection(obj, collection):
    for old in tuple(obj.users_collection):
        old.objects.unlink(obj)
    collection.objects.link(obj)
    return obj


def link_mesh(name, vertices, faces, material, collection, parent=None, smooth_shading=True):
    mesh = bpy.data.meshes.new(name + "Mesh")
    mesh.from_pydata(vertices, [], faces)
    mesh.update()
    obj = bpy.data.objects.new(name, mesh)
    collection.objects.link(obj)
    if material:
        obj.data.materials.append(material)
    if parent:
        obj.parent = parent
    if smooth_shading:
        for poly in mesh.polygons:
            poly.use_smooth = True
    return obj


def ring_mesh(name, rings, material, collection, parent=None, segments=32):
    """Editable coherent ring-based mesh, cap poles + quads; z-up."""
    v = []
    faces = []
    for z, rx, ry, yc in rings:
        for step in range(segments):
            t = 2 * math.pi * step / segments
            v.append((rx * math.cos(t), yc + ry * math.sin(t), z))
    for row in range(len(rings) - 1):
        for col in range(segments):
            next_col = (col + 1) % segments
            a, b = row * segments + col, row * segments + next_col
            c, d = (row + 1) * segments + next_col, (row + 1) * segments + col
            faces.append((a, b, c, d))
    faces += [tuple(reversed(range(segments)))]
    faces += [tuple((len(rings) - 1) * segments + i for i in range(segments))]
    result = link_mesh(name, v, faces, material, collection, parent)
    mod = result.modifiers.new("Gentle subdivision", "SUBSURF")
    mod.levels = 1
    mod.render_levels = 2
    return result


def create_shape_keys(obj, kitten_delta, senior_delta):
    basis = obj.shape_key_add(name="Basis")
    kitten = obj.shape_key_add(name="Age_Kitten")
    older = obj.shape_key_add(name="Age_Senior")
    for idx, point in enumerate(basis.data):
        x, y, z = point.co
        kitten.data[idx].co = (x * kitten_delta[0], y * kitten_delta[1], z * kitten_delta[2])
        older.data[idx].co = (x * senior_delta[0], y * senior_delta[1], z * senior_delta[2])
    return kitten, older


def uv_ellipsoid(name, location, radius, material, collection, parent):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=24, ring_count=12, location=location)
    obj = bpy.context.object
    obj.name = name
    object_to_collection(obj, collection)
    if parent:
        obj.parent = parent
        obj.matrix_parent_inverse = parent.matrix_world.inverted()
    obj.scale = radius
    obj.data.materials.append(material)
    for face in obj.data.polygons:
        face.use_smooth = True
    return obj


def curve_tube(name, coords, material, collection, parent, radius=0.018):
    data = bpy.data.curves.new(name + "Curve", "CURVE")
    data.dimensions = "3D"
    data.resolution_u = 18
    data.bevel_depth = radius
    data.bevel_resolution = 3
    data.use_fill_caps = True
    spline = data.splines.new("BEZIER")
    spline.bezier_points.add(len(coords) - 1)
    for point, xyz in zip(spline.bezier_points, coords):
        point.co = xyz
        point.handle_left_type = "AUTO"
        point.handle_right_type = "AUTO"
    obj = bpy.data.objects.new(name, data)
    collection.objects.link(obj)
    obj.data.materials.append(material)
    obj.parent = parent
    return obj


def ear_mesh(side, fur, pink, collection, head):
    # Prismatic triangle, not an upside-down cone.
    x = side * 0.33
    z0, tip = 0.28, 0.82
    v = [(x - 0.19, -0.15, z0), (x + 0.19, -0.15, z0),
         (x - side * 0.06, -0.08, tip),
         (x - 0.19, 0.02, z0), (x + 0.19, 0.02, z0),
         (x - side * 0.06, 0.00, tip)]
    faces = [(0, 1, 2), (3, 5, 4), (0, 3, 4, 1),
             (1, 4, 5, 2), (2, 5, 3, 0)]
    link_mesh("Ear_" + str(side), v, faces, fur, collection, head, False)
    inner = [(x - .11, -.158, .34), (x + .11, -.158, .34),
             (x - side * .05, -.095, .69)]
    link_mesh("InnerEar_" + str(side), inner, [(0, 1, 2)], pink, collection, head, False)


def configure_render(size):
    scene = bpy.context.scene
    engines = ("BLENDER_EEVEE_NEXT", "BLENDER_EEVEE")
    for engine in engines:
        try:
            scene.render.engine = engine
            break
        except TypeError:
            continue
    else:
        # Eevee enum spelling can change; fall back only when necessary.
        print("[WARN] EEVEE engine unavailable; using Blender's active renderer.")
    scene.render.resolution_x = size
    scene.render.resolution_y = size
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = "PNG"
    scene.render.film_transparent = False
    scene.render.film_transparent = False
    scene.world.use_nodes = True
    bg = next(n for n in scene.world.node_tree.nodes if n.type == "BACKGROUND")
    bg.inputs["Color"].default_value = (0.88, 0.81, 0.78, 1)
    bg.inputs["Strength"].default_value = .45
    try:
        scene.view_settings.view_transform = "AgX"
    except TypeError:
        scene.view_settings.view_transform = "Standard"


def aim_at(obj, point):
    direction = Vector(point) - obj.location
    obj.rotation_euler = direction.to_track_quat("-Z", "Y").to_euler()


def area_light(name, location, power, tint, size, collection):
    data = bpy.data.lights.new(name, "AREA")
    data.energy = power
    data.color = tint
    data.shape = "DISK"
    data.size = size
    obj = bpy.data.objects.new(name, data)
    collection.objects.link(obj)
    obj.location = location
    aim_at(obj, (0, 0, 1.1))
    return obj


def make_scene(output, size):
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)
    for m in tuple(bpy.data.materials):
        if m.users == 0:
            bpy.data.materials.remove(m)
    configure_render(size)
    coll_cat = collect("CHARACTER — export candidate")
    coll_stage = collect("SET — preview only, never export with cat")
    coll_lights = collect("LIGHTS and CAMERA — preview only")
    mats = {
        "fur": make_material("Cat Fur | warm cream matte", FUR),
        "cream": make_material("Chest Fur | ivory", CREAM),
        "pink": make_material("Silk Bow | dusty rose", PINK),
        "ink": make_material("Ink | Paris blue", INK),
        "jade": make_material("Iris | sea glass", JADE, .80),
        "gold": make_material("Bell | antique gold", GOLD, .57),
        "velvet": make_material("Seat | antique blush", (.68, .40, .48, 1)),
        "floor": make_material("Background | warm paper", (.88, .78, .71, 1)),
    }

    root = bpy.data.objects.new("CAT_RIG", None)
    coll_cat.objects.link(root)
    root.empty_display_type = "PLAIN_AXES"
    root["cat_age"] = 10.0
    root["age_range"] = [0.0, CAT_MAX]
    root["source_model"] = "cat-growth.js"
    root["blockout_warning"] = "NOT FINAL ART: sculpt improved continuous feline anatomy"

    body = ring_mesh("CatBody", [
        (.05,.08,.06,0),(.17,.38,.35,.03),(.45,.58,.49,.03),(.80,.60,.49,.10),
        (1.15,.48,.40,.06),(1.40,.37,.34,-.06),(1.57,.29,.29,-.08),
        (1.64,.15,.15,-.06),(1.68,.015,.015,-.06)
    ], mats["fur"], coll_cat, root)
    create_shape_keys(body, (.92,.96,.88), (1.01,1.02,.96))

    head = bpy.data.objects.new("HEAD_RIG", None)
    coll_cat.objects.link(head)
    head.parent = root
    head.location = (0, -.12, 1.67)
    head.empty_display_type = "SPHERE"
    skull = ring_mesh("CatHead", [
        (-.52,.07,.07,0),(-.42,.40,.33,-.02),(-.24,.58,.44,-.02),
        (0,.63,.48,.01),(.24,.56,.41,.03),(.39,.36,.30,.07),
        (.47,.09,.08,.07)
    ], mats["fur"], coll_cat, head)
    create_shape_keys(skull, (1.15,1.08,1.08), (1.0,1.0,.96))

    for side in (-1, 1):
        ear_mesh(side, mats["fur"], mats["pink"], coll_cat, head)
        # Cheap placeholder eyes, deliberately shallow; sculpt proper eye sockets later.
        uv_ellipsoid("EyelidRim_" + str(side), (side*.27,-.456,.035),
                     (.135,.025,.095), mats["ink"], coll_cat, head)
        uv_ellipsoid("EyeWhite_" + str(side), (side*.27,-.479,.035),
                     (.116,.019,.078), mats["cream"], coll_cat, head)
        uv_ellipsoid("Iris_" + str(side), (side*.27,-.497,.027),
                     (.066,.017,.074), mats["jade"], coll_cat, head)
        uv_ellipsoid("Pupil_" + str(side), (side*.27,-.508,.027),
                     (.022,.008,.065), mats["ink"], coll_cat, head)
        uv_ellipsoid("Cheek_" + str(side), (side*.145,-.405,-.255),
                     (.195,.093,.09), mats["cream"], coll_cat, head)
        # Age-neutral whiskers: narrow, not evenly spaced white rods.
        for index in range(2):
            curve_tube("Whisker_%s_%s" % (side,index),
                [(side*.23,-.48,-.22-index*.06),
                 (side*.47,-.55,-.17-index*.09),
                 (side*.73,-.48,-.09-index*.14)],
                mats["cream"], coll_cat, head, .003)

    # A flat triangular nose is less uncanny than a protruding sphere.
    link_mesh("Nose", [(-.055,-.504,-.215),(.055,-.504,-.215),(0,-.51,-.277)],
              [(0,1,2)], mats["pink"], coll_cat, head, False)

    for side in (-1,1):
        curve_tube("SmallMouth_"+str(side),[(0,-.512,-.28),
                   (side*.04,-.514,-.32),(side*.10,-.497,-.315)],
                   mats["ink"], coll_cat, head, .0045)

    # Blockout forelegs + paws; these are candidates for continuous retopology.
    for side in (-1,1):
        uv_ellipsoid("FrontLeg_"+str(side), (side*.38,-.32,.51),
                      (.19,.20,.50), mats["fur"], coll_cat, root)
        uv_ellipsoid("Paw_"+str(side), (side*.38,-.52,.12),
                      (.22,.25,.115), mats["fur"], coll_cat, root)
        uv_ellipsoid("Haunch_"+str(side), (side*.50,.10,.37),
                      (.27,.40,.35), mats["fur"], coll_cat, root)

    curve_tube("LongTaperedTail", [
        (.50,.18,.20),(.83,.17,.20),(1.07,.23,.46),
        (1.12,.24,.79),(1.00,.25,1.04),(.83,.24,1.05)
    ], mats["fur"], coll_cat, root, .092)

    curve_tube("RoseCollar", [(-.34,-.17,1.48),(-.21,-.46,1.50),
                (0,-.52,1.51),(.21,-.46,1.50),(.34,-.17,1.48)],
                mats["pink"], coll_cat, root, .051)
    uv_ellipsoid("CollarBell", (0,-.57,1.43),(.065,.057,.07),
                 mats["gold"], coll_cat, root)

    # Stage is a 3D art-director reference, NOT bundled into character GLB.
    bpy.ops.mesh.primitive_cube_add(size=2, location=(0,0,-.15))
    floor = bpy.context.object
    floor.name = "Velvet window seat — stage only"
    object_to_collection(floor, coll_stage)
    floor.scale=(1.56,.95,.16)
    floor.data.materials.append(mats["velvet"])
    bevel = floor.modifiers.new("Soft upholstered edges", "BEVEL")
    bevel.width = .13
    bevel.segments = 4
    floor.modifiers.new("Weighted normals", "WEIGHTED_NORMAL")

    bpy.ops.mesh.primitive_plane_add(size=2, location=(0,0,-.33))
    ground=bpy.context.object
    ground.name="Backdrop plane — stage only"
    object_to_collection(ground, coll_stage)
    ground.scale=(200,200,200)
    ground.data.materials.append(mats["floor"])

    cam_data=bpy.data.cameras.new("Hero Portrait Camera")
    camera=bpy.data.objects.new("Hero Portrait Camera",cam_data)
    coll_lights.objects.link(camera)
    camera.location=(3.0,-6.7,2.7)
    aim_at(camera,(0,0,1.18))
    camera.data.type="ORTHO"
    camera.data.ortho_scale=4.0
    bpy.context.scene.camera=camera

    area_light("Key | Paris golden diffuse",(-3,-4,6),650,(1.0,.84,.73),5,coll_lights)
    area_light("Fill | pale sky",(3,-1,3.5),340,(.76,.85,1.0),4,coll_lights)
    area_light("Rim | rose sunset",(1.5,3,4),480,(1.0,.71,.75),3,coll_lights)

    return root, head, body, skull, mats["fur"], camera


def set_age(root, head, body, skull, fur, cat_age):
    """Apply web-matched absolute growth + continuous starter morphs."""
    age = min(CAT_MAX, max(0.0, float(cat_age)))
    grow = smooth(0,2.5,age)
    kitten = 1-smooth(.2,3.25,age)
    senior = smooth(12,33,age)
    elder = smooth(20,CAT_MAX,age)
    size = .43 + .57*grow
    root.scale = (size,size,size)
    # All paws are modelled on z >=0, so scaling about z=0 keeps contact.
    root.location=(0,0,0)
    head.scale=(1+.13*kitten,1+.09*kitten,1+.10*kitten)
    body.data.shape_keys.key_blocks["Age_Kitten"].value = kitten
    body.data.shape_keys.key_blocks["Age_Senior"].value = senior
    skull.data.shape_keys.key_blocks["Age_Kitten"].value = kitten
    skull.data.shape_keys.key_blocks["Age_Senior"].value = senior
    silver_factor = .44*senior+.26*elder
    tint=tuple(lerp(a,b,silver_factor) for a,b in zip(FUR,SILVER))
    fur.diffuse_color=tint
    surface=next(n for n in fur.node_tree.nodes if n.type=="BSDF_PRINCIPLED")
    surface.inputs["Base Color"].default_value=tint
    root["cat_age"]=age
    bpy.context.view_layer.update()


def main():
    opt=args()
    output=Path(os.path.abspath(os.path.expanduser(opt.output_dir)))
    output.mkdir(parents=True,exist_ok=True)
    root, head, body, skull, fur, camera=make_scene(output,opt.size)
    set_age(root,head,body,skull,fur,10)
    blend_path=output/"scene.blend"
    bpy.ops.wm.save_as_mainfile(filepath=str(blend_path))
    render_files=[]
    if not opt.skip_renders:
        for age in (0,2,10,25):
            set_age(root,head,body,skull,fur,age)
            destination=output/("age-%02d.png"%age)
            bpy.context.scene.render.filepath=str(destination)
            bpy.ops.render.render(write_still=True)
            render_files.append(str(destination))
        set_age(root,head,body,skull,fur,10)
        bpy.context.scene.render.filepath=""
        bpy.ops.wm.save_as_mainfile(filepath=str(blend_path))
    manifest={
        "kind":"True Cat Years starter BLOCKOUT; requires artistic refinement",
        "blender_version":bpy.app.version_string,
        "blend":str(blend_path),
        "rendered_pngs":render_files,
        "checkpoint_ages":[0,2,10,25],
        "shape_keys":{"CatBody":["Age_Kitten","Age_Senior"],
                      "CatHead":["Age_Kitten","Age_Senior"]},
        "warning":"Do not deploy as polished character; visually inspect and sculpt."
    }
    (output/"manifest.json").write_text(json.dumps(manifest,indent=2),encoding="utf8")
    print("TRUE_CAT_YEARS_RESULT="+json.dumps(manifest))


if __name__=="__main__":
    main()
