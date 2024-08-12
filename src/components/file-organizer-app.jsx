import React, { useState } from 'react';
import { saveAs } from 'file-saver';
import JSZip from 'jszip';

const FileOrganizer = () => {
  const [files, setFiles] = useState([]);
  const [structure, setStructure] = useState('');
  const [error, setError] = useState('');

  const handleFileChange = (event) => {
    setFiles(Array.from(event.target.files));
    setError('');
  };

  const handleStructureChange = (event) => {
    setStructure(event.target.value);
    setError('');
  };

  const parseStructure = (structureText) => {
    const lines = structureText.split('\n');
    const root = { name: '', children: {} };
    const stack = [{ node: root, indent: -1 }];

    lines.forEach(line => {
      const trimmedLine = line.trim();
      if (trimmedLine === '') return;

      const indent = line.search(/[├└]/);
      const name = trimmedLine.replace(/[├─└│]/g, '').trim();

      while (stack.length > 1 && indent <= stack[stack.length - 1].indent) {
        stack.pop();
      }

      const parent = stack[stack.length - 1].node;
      if (name.endsWith('/')) {
        const folderName = name.slice(0, -1);
        const newFolder = { name: folderName, children: {} };
        parent.children[folderName] = newFolder;
        stack.push({ node: newFolder, indent });
      } else {
        parent.children[name] = null;
      }
    });

    return root;
  };

  const createZip = async () => {
    try {
      if (structure.trim() === '') {
        throw new Error('Please provide a folder structure.');
      }

      const zip = new JSZip();
      console.log(structure)
      const structureObj = parseStructure(structure);
      console.log(structureObj)

      const addToZip = (obj, currentPath = '') => {
        for (const [name, value] of Object.entries(obj.children)) {
          const newPath = currentPath + name;
          if (value === null) {
            // This is a file
            const file = files.find(f => f.name === name);
            if (file) {
              zip.file(newPath, file);
            } else {
              // Create an empty file if not found in uploads
              zip.file(newPath, '');
            }
          } else {
            // This is a directory
            zip.folder(newPath);
            addToZip(value, newPath + '/');
          }
        }
      };

      addToZip(structureObj);

      const content = await zip.generateAsync({ type: 'blob' });
      saveAs(content, 'organized_files.zip');
      setError('');
    } catch (err) {
      console.error('Error creating zip:', err);
      setError(err.message || 'An error occurred while creating the zip file.');
    }
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">File Organizer</h1>
      {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4" role="alert">{error}</div>}
      <div className="mb-4">
        <label className="block mb-2">Upload Files:</label>
        <input type="file" multiple onChange={handleFileChange} className="border p-2" />
      </div>
      <div className="mb-4">
        <label className="block mb-2">Folder Structure:</label>
        <textarea
          value={structure}
          onChange={handleStructureChange}
          className="border p-2 w-full h-64 font-mono"
          placeholder={`my-project/
  ├── src/
  │   ├── components/
  │   │   └── Component1.js
  │   ├── utils/
  │   │   └── helper.js
  │   └── App.js
  ├── public/
  │   └── index.html
  └── package.json
  `}
        />
      </div>
      <button onClick={createZip} className="bg-blue-500 text-white px-4 py-2 rounded">
        Download Zip
      </button>
    </div>
  );
};

export default FileOrganizer;
