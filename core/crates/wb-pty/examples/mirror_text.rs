// Prints the visible screen for recorded bytes. scripts/check-mirror-parity.mjs compares it with @xterm/headless.
// usage: mirror_text <file> <cols> <rows>            one screen for raw bytes
//        mirror_text --events <file> <cols> <rows>   lines of "d <hex>" and "r <cols> <rows>"; one screen after each event
fn main() {
    let a: Vec<String> = std::env::args().collect();
    if a[1] != "--events" {
        let bytes = std::fs::read(&a[1]).expect("read");
        print!("{}", wb_pty::mirror_text(&bytes, a[2].parse().unwrap(), a[3].parse().unwrap()));
        return;
    }
    let text = std::fs::read_to_string(&a[2]).expect("read");
    let (mut cols, mut rows): (u16, u16) = (a[3].parse().unwrap(), a[4].parse().unwrap());
    let mut parser = vt100::Parser::new(rows, cols, 0);
    for line in text.lines() {
        let mut parts = line.split(' ');
        match parts.next() {
            Some("d") => {
                let hex = parts.next().unwrap_or("");
                let bytes: Vec<u8> = (0..hex.len() / 2).map(|i| u8::from_str_radix(&hex[i * 2..i * 2 + 2], 16).unwrap()).collect();
                parser.process(&bytes);
            }
            Some("r") => {
                cols = parts.next().unwrap().parse().unwrap();
                rows = parts.next().unwrap().parse().unwrap();
                parser.screen_mut().set_size(rows, cols);
            }
            _ => {}
        }
        println!("{}\u{1}", parser.screen().rows(0, cols).collect::<Vec<_>>().join("\n"));
    }
}
