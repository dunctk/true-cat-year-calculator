#!/usr/bin/env python3
"""
Run with:
    blender --background blender/output/scene.blend --python blender/scripts/validate_scene.py
Requires a Blender-produced .blend; cannot run in plain CPython without bpy.
"""
import json
import math

import bpy


def assert_scene():
    scene = bpy.context.scene
    root = bpy.data.objects.get("CAT_RIG")
    head = bpy.data.objects.get("HEAD_RIG")
    body = bpy.data.objects.get("CatBody")
    skull = bpy.data.objects.get("CatHead")
    camera = scene.camera
    assert root is not None, "Missing CAT_RIG"
    assert head is not None and head.parent == root, "HEAD_RIG not parented"
    assert camera is not None and camera.data.type == "ORTHO", "Missing ortho camera"
    for mesh in (body, skull):
        assert mesh and mesh.type == "MESH", "Missing character mesh"
        assert len(mesh.data.vertices) > 100, "Insufficient blockout topology"
        keys=mesh.data.shape_keys
        assert keys, "Missing shape keys for "+mesh.name
        assert "Age_Kitten" in keys.key_blocks, "Missing kitten target on "+mesh.name
        assert "Age_Senior" in keys.key_blocks, "Missing senior target on "+mesh.name
        assert len(keys.key_blocks["Age_Kitten"].data)==len(mesh.data.vertices), "Topology mismatch"
    world_paw_z = []
    for age in (0, .5, 2, 2.5, 10, 25, 38):
        grow=max(0.0,min(1.0,age/2.5))
        eased=grow*grow*(3-2*grow)
        expected_size=.43+.57*eased
        assert .43 <= expected_size <= 1.0
        root.scale=(expected_size,)*3
        root.location=(0,0,0)
        bpy.context.view_layer.update()
        assert abs(root.matrix_world.translation.z) < 1e-5, "Ground pivot moved"
        world_paw_z.append(root.matrix_world.translation.z)
    assert len(set(world_paw_z))==1, "Root pivot drifts"
    print("TRUE_CAT_YEARS_SCENE_VALID="+json.dumps({
        "blender":bpy.app.version_string,
        "objects":len(bpy.data.objects),
        "body_vertices":len(body.data.vertices),
        "head_vertices":len(skull.data.vertices),
        "camera":camera.name,
        "checkpoint_ages":[0,2,10,25],
        "validation":"PASS — structural, not artistic"
    }))


assert_scene()
