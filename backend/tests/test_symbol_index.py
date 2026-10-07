from app.services.symbol_index import extract_symbols


def test_python_extractor():
    code = """
import os
from pydantic import BaseModel

class User(BaseModel):
    pass

@router.post('/login')
async def login():
    pass
"""
    symbols = extract_symbols("test.py", code)
    assert "User" in symbols["classes"]
    assert "login" in symbols["functions"]
    assert "os" in symbols["imports"]
    assert "pydantic.BaseModel" in symbols["imports"]
    assert "POST /login" in symbols["routes"]


def test_js_extractor():
    code = """
import { useState } from 'react';
function App() {}
const helper = () => {}
class Component {}
"""
    symbols = extract_symbols("test.js", code)
    assert "App" in symbols["functions"]
    assert "helper" in symbols["functions"]
    assert "Component" in symbols["classes"]
    assert "react" in symbols["imports"]
