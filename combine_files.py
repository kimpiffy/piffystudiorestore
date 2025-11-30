import os

# Define the directories to scan for your shop files
directories_to_scan = ['shop', 'shop/templates', 'shop/static', 'shop/forms.py', 'shop/urls.py']
output_file = 'shop_project_combined.txt'

# Open the output file in write mode
with open(output_file, 'w') as outfile:
    for directory in directories_to_scan:
        if os.path.isdir(directory):
            # If it's a directory, walk through it and process the files
            for subdir, dirs, files in os.walk(directory):
                for file in files:
                    # Only open .py, .html, .css files
                    if file.endswith(('.py', '.html', '.css')):
                        filepath = os.path.join(subdir, file)
                        outfile.write(f"\n\n### {filepath} ###\n\n")  # Write the file path as a header
                        with open(filepath, 'r') as infile:
                            outfile.write(infile.read())  # Append file content
                        outfile.write("\n" + "="*50 + "\n")  # Separator after each file
        else:
            # If it's a file, just append it directly
            if directory.endswith(('.py', '.html', '.css')):
                outfile.write(f"\n\n### {directory} ###\n\n")
                with open(directory, 'r') as infile:
                    outfile.write(infile.read())
                outfile.write("\n" + "="*50 + "\n")

print(f"Files combined into {output_file}")
