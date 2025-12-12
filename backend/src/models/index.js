import Department from './Department.js';
import Subject from './Subject.js';
import Folder from './Folder.js';
import Document from './Document.js';
import DocumentMetadata from './DocumentMetadata.js';

// Folder associations
Folder.belongsTo(Department, { as: 'department', foreignKey: 'departmentId' });
Folder.belongsTo(Subject, { as: 'subject', foreignKey: 'subjectId' });
Folder.hasMany(Document, { as: 'documents', foreignKey: 'folderId' });

// Document associations
Document.belongsTo(Folder, { as: 'folder', foreignKey: 'folderId' });
Document.hasMany(DocumentMetadata, { as: 'metadata', foreignKey: 'documentId' });

// DocumentMetadata associations
DocumentMetadata.belongsTo(Document, { as: 'document', foreignKey: 'documentId' });

export { Department, Subject, Folder, Document, DocumentMetadata };
