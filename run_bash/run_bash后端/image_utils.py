import re
from PIL import Image, ImageDraw, ImageFont

# 定义ANSI转义字符解析
class ANSIParser:
    def __init__(self):
        self.reset()
        
    def reset(self):
        self.fg_color = (255, 255, 255)  # 默认白色
        self.bg_color = (0, 0, 0)        # 默认黑色
        self.bold = False
        self.italic = False
        self.underline = False
        
    def parse(self, text):
        ansi_pattern = re.compile(r'\x1b\[([\d;]*)([A-Za-z])')
        parts = []
        current_pos = 0
        current_style = self.get_current_style()
        
        for match in ansi_pattern.finditer(text):
            start = match.start()
            end = match.end()
            if start > current_pos:
                parts.append((text[current_pos:start], current_style))
            codes_str, command = match.groups()
            if command == 'm':  # 仅处理样式相关的ANSI序列
                codes = [0] if codes_str == '' else list(map(int, codes_str.split(';')))
                for code in codes:
                    self.process_code(code)
                current_style = self.get_current_style()
            current_pos = end
        
        if current_pos < len(text):
            parts.append((text[current_pos:], current_style))
        return parts
    
    def process_code(self, code):
        if code == 0:
            self.reset()
        elif code == 1:
            self.bold = True
        elif code == 3:
            self.italic = True
        elif code == 4:
            self.underline = True
        elif code == 22:
            self.bold = False
        elif code == 23:
            self.italic = False
        elif code == 24:
            self.underline = False
        elif 30 <= code <= 37:
            self.fg_color = self.get_ansi_color(code - 30)
        elif code == 39:
            self.fg_color = (255, 255, 255)  # 默认白色
        elif 40 <= code <= 47:
            self.bg_color = self.get_ansi_color(code - 40)
        elif code == 49:
            self.bg_color = (0, 0, 0)        # 默认黑色
    
    def get_ansi_color(self, index):
        colors = [
            (0, 0, 0),        # 黑色
            (170, 0, 0),      # 红色
            (0, 170, 0),      # 绿色
            (170, 170, 0),    # 黄色
            (0, 0, 170),      # 蓝色
            (170, 0, 170),    # 紫色
            (0, 170, 170),    # 青色
            (170, 170, 170)   # 浅灰色
        ]
        return colors[index]
    
    def get_current_style(self):
        return {
            'fg_color': self.fg_color,
            'bg_color': self.bg_color,
            'bold': self.bold,
            'italic': self.italic,
            'underline': self.underline
        }

# 绘制文本到图片
def draw_image(text, font_size=21, line_spacing=1.2, padding=5):
    if not text:
        return None
    
    parser = ANSIParser()
    parts = parser.parse(text)
    
    try:
        font_regular = ImageFont.truetype("./fonts/SarasaMonoSC-Regular.ttf", font_size)
        font_bold = ImageFont.truetype("./fonts/SarasaMonoSC-Bold.ttf", font_size)
        font_italic = ImageFont.truetype("./fonts/SarasaMonoSC-Italic.ttf", font_size)
        font_bold_italic = ImageFont.truetype("./fonts/SarasaMonoSC-BoldItalic.ttf", font_size)
    except IOError:
        raise Exception("字体文件未找到，请确认字体路径。")

    max_width = 0
    lines = []
    current_line = []
    current_width = 0
    current_y = 0

    for part in parts:
        text_part, style = part
        for char in text_part:
            if char == '\n':
                lines.append((current_line, current_y))
                current_line = []
                current_width = 0
                current_y += int(font_size * line_spacing)
                continue

            if style['bold'] and style['italic']:
                font = font_bold_italic
            elif style['bold']:
                font = font_bold
            elif style['italic']:
                font = font_italic
            else:
                font = font_regular

            bbox = font.getbbox(char)
            char_width = bbox[2] - bbox[0]
            current_line.append((char, style))
            current_width += char_width
            if current_width > max_width:
                max_width = current_width

    if current_line:
        lines.append((current_line, current_y))

    image_width = max_width + 2 * padding
    image_height = current_y + font_size + 2 * padding
    image = Image.new('RGB', (image_width, image_height), (0, 0, 0))
    draw = ImageDraw.Draw(image)
    y = padding

    for line, line_y in lines:
        x = padding
        for char, style in line:
            if style['bold'] and style['italic']:
                font = font_bold_italic
            elif style['bold']:
                font = font_bold
            elif style['italic']:
                font = font_italic
            else:
                font = font_regular

            bbox = font.getbbox(char)
            char_width = bbox[2] - bbox[0]
            char_height = bbox[3] - bbox[1]

            draw.rectangle([x, y, x + char_width, y + char_height], fill=style['bg_color'])
            draw.text((x, y), char, font=font, fill=style['fg_color'])

            if style['underline']:
                underline_y = y + char_height - 2
                draw.line([x, underline_y, x + char_width, underline_y], fill=style['fg_color'], width=1)
            x += char_width
        y += int(font_size * line_spacing)

    return image