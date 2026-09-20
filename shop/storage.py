import os

import cloudinary.uploader
from cloudinary_storage.storage import MediaCloudinaryStorage


class OverwritingMediaCloudinaryStorage(MediaCloudinaryStorage):
    """MediaCloudinaryStorage that uploads to a deterministic public_id.

    The upstream _upload() leaves `unique_filename` at Cloudinary's default
    (True), so every upload gets a random suffix appended and never matches
    the name Django/exists()/url() expect. Forcing an explicit public_id with
    unique_filename=False and overwrite=True keeps re-uploads idempotent.
    """

    def _upload(self, name, content):
        public_id, _ext = os.path.splitext(name)
        options = {
            'public_id': public_id,
            'unique_filename': False,
            'overwrite': True,
            'invalidate': True,
            'resource_type': self._get_resource_type(name),
            'tags': self.TAG,
        }
        return cloudinary.uploader.upload(content, **options)
