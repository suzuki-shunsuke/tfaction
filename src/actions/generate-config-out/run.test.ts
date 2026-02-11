import { describe, it, expect } from "vitest";
import {
  filterGeneratedContent,
  getWriteMode,
  prepareContentForWrite,
  generateTempFileName,
  formatTimestamp,
} from "./run";

describe("filterGeneratedContent", () => {
  it("removes comment lines starting with #", () => {
    const content = `# This is a comment
resource "aws_instance" "example" {
  ami = "ami-123456"
}`;
    const result = filterGeneratedContent(content);
    expect(result).toBe(`resource "aws_instance" "example" {
  ami = "ami-123456"
}
`);
  });

  it("removes lines that start with # after trimming whitespace", () => {
    const content = `   # comment with leading spaces
  # another comment with indent
resource "null_resource" "test" {}`;
    const result = filterGeneratedContent(content);
    expect(result).toBe(`resource "null_resource" "test" {}
`);
  });

  it("removes empty lines", () => {
    const content = `resource "aws_s3_bucket" "bucket" {

  bucket = "my-bucket"

}`;
    const result = filterGeneratedContent(content);
    expect(result).toBe(`resource "aws_s3_bucket" "bucket" {
  bucket = "my-bucket"
}
`);
  });

  it("removes lines containing only whitespace", () => {
    const content = `resource "test" "a" {


  name = "test"
}`;
    const result = filterGeneratedContent(content);
    expect(result).toBe(`resource "test" "a" {
  name = "test"
}
`);
  });

  it("preserves valid Terraform code", () => {
    const content = `resource "aws_instance" "web" {
  ami           = "ami-0c55b159cbfafe1f0"
  instance_type = "t2.micro"
  tags = {
    Name = "HelloWorld"
  }
}`;
    const result = filterGeneratedContent(content);
    expect(result).toBe(content + "\n");
  });

  it("always ends with a newline", () => {
    const content = `resource "test" "x" {}`;
    const result = filterGeneratedContent(content);
    expect(result.endsWith("\n")).toBe(true);
  });

  it("always ends with exactly one newline", () => {
    const content = `resource "test" "x" {}


`;
    const result = filterGeneratedContent(content);
    expect(result).toBe(`resource "test" "x" {}
`);
    expect(result.endsWith("\n")).toBe(true);
    expect(result.endsWith("\n\n")).toBe(false);
  });

  it("handles mixed content with comments, empty lines, and code", () => {
    const content = `# __generated__ by Terraform
# Please review these resources and move them into your main configuration files.

# __generated__ by Terraform from "arn:aws:s3:::my-bucket"
resource "aws_s3_bucket" "example" {
  bucket = "my-bucket"
}

# __generated__ by Terraform from "arn:aws:ec2:..."
resource "aws_instance" "example" {
  ami = "ami-12345678"
  instance_type = "t2.micro"
}`;

    const result = filterGeneratedContent(content);
    expect(result).toBe(`resource "aws_s3_bucket" "example" {
  bucket = "my-bucket"
}
resource "aws_instance" "example" {
  ami = "ami-12345678"
  instance_type = "t2.micro"
}
`);
  });

  it("handles empty content", () => {
    const content = "";
    const result = filterGeneratedContent(content);
    expect(result).toBe("\n");
  });

  it("handles content that is only comments", () => {
    const content = `# comment 1
# comment 2
  # comment 3`;
    const result = filterGeneratedContent(content);
    expect(result).toBe("\n");
  });

  it("handles content that is only empty lines", () => {
    const content = `



`;
    const result = filterGeneratedContent(content);
    expect(result).toBe("\n");
  });

  it("preserves lines with # that do not start with #", () => {
    const content = `resource "test" "x" {
  count = 1 # this is an inline comment
}`;
    const result = filterGeneratedContent(content);
    expect(result).toBe(`resource "test" "x" {
  count = 1 # this is an inline comment
}
`);
  });

  it("removes indented comment lines", () => {
    // Lines that start with # after trimming are removed (indented comments)
    const content = `resource "test" "x" {
  # This is an indented comment line - will be removed
  name = "test"
}`;
    const result = filterGeneratedContent(content);
    expect(result).toBe(`resource "test" "x" {
  name = "test"
}
`);
  });

  it("preserves indentation of valid lines", () => {
    const content = `resource "test" "x" {
  nested {
    deep {
      value = "test"
    }
  }
}`;
    const result = filterGeneratedContent(content);
    expect(result).toBe(content + "\n");
  });
});

describe("getWriteMode", () => {
  it('returns "append" when target file exists', () => {
    expect(getWriteMode(true)).toBe("append");
  });

  it('returns "write" when target file does not exist', () => {
    expect(getWriteMode(false)).toBe("write");
  });
});

describe("prepareContentForWrite", () => {
  it("adds leading newline for append mode", () => {
    const content = `resource "test" "x" {}
`;
    const result = prepareContentForWrite(content, "append");
    expect(result).toBe("\n" + content);
  });

  it("returns content unchanged for write mode", () => {
    const content = `resource "test" "x" {}
`;
    const result = prepareContentForWrite(content, "write");
    expect(result).toBe(content);
  });
});

describe("generateTempFileName", () => {
  it("generates file name with run ID and timestamp", () => {
    const result = generateTempFileName("12345", "20240115103045");
    expect(result).toBe("generated_12345_20240115103045.tf");
  });

  it("generates file name with different run ID", () => {
    const result = generateTempFileName("99999", "20230601120000");
    expect(result).toBe("generated_99999_20230601120000.tf");
  });
});

describe("formatTimestamp", () => {
  it("formats date to YYYYMMDDHHMMSS format", () => {
    const date = new Date("2024-01-15T10:30:45.123Z");
    const result = formatTimestamp(date);
    expect(result).toBe("20240115103045");
  });

  it("handles midnight correctly", () => {
    const date = new Date("2024-06-01T00:00:00.000Z");
    const result = formatTimestamp(date);
    expect(result).toBe("20240601000000");
  });

  it("handles end of day correctly", () => {
    const date = new Date("2024-12-31T23:59:59.999Z");
    const result = formatTimestamp(date);
    expect(result).toBe("20241231235959");
  });

  it("removes milliseconds", () => {
    const date = new Date("2024-01-01T12:30:45.789Z");
    const result = formatTimestamp(date);
    expect(result).not.toContain(".");
    expect(result).not.toContain("789");
  });
});
