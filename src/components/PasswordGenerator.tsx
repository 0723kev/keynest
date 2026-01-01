import { useMemo, useState } from "react";
import zxcvbn from "zxcvbn";
import {
  Button,
  Slider,
  Tag,
  TagGroup,
  Label,
  Disclosure,
  type Key,
  Input,
  ButtonGroup,
} from "@heroui/react";
import { generatePassword } from "@/utils/password";

export default function PasswordGenerator({
  setPassword,
  expanded,
  setExpanded,
}: {
  setPassword: (pw: string) => void;
  expanded?: boolean;
  setExpanded?: (expanded: boolean) => void;
}) {
  const [length, setLength] = useState(20);
  const [selectedSets, setSelectedSets] = useState<Iterable<Key>>(
    new Set(["uppercase", "lowercase", "numbers", "symbols"])
  );

  const opts = useMemo(() => {
    const set =
      selectedSets === "all"
        ? new Set<Key>(["uppercase", "lowercase", "numbers", "symbols"])
        : new Set(Array.from(selectedSets));

    return {
      upper: set.has("uppercase"),
      lower: set.has("lowercase"),
      numbers: set.has("numbers"),
      symbols: set.has("symbols"),
    };
  }, [selectedSets]);

  const password = useMemo(() => {
    try {
      return generatePassword({
        length,
        upper: opts.upper,
        lower: opts.lower,
        numbers: opts.numbers,
        symbols: opts.symbols,
      });
    } catch {
      return "";
    }
  }, [length, opts]);

  const strength = useMemo(() => {
    if (!password) return null;
    return zxcvbn(password);
  }, [password]);

  const strengthLabel = ["Very weak", "Weak", "Okay", "Strong", "Very strong"][
    strength?.score ?? 0
  ];

  const strengthPercent = ((strength?.score ?? 0) / 4) * 100;

  return (
    <Disclosure isExpanded={expanded} onExpandedChange={setExpanded}>
      <Disclosure.Content>
        <div className="space-y-2 rounded-xl border bg-muted/10 p-4">
          <div className="flex items-center gap-2">
            <ButtonGroup className="flex-1">
              <Input
                value={password || "—"}
                className="focus:ring-0 flex-1 rounded-r-none bg-background px-4 py-2 font-mono text-sm truncate"
              />
              <Button
                variant="tertiary"
                className="bg-background"
                onPress={() => setPassword(password)}
                isDisabled={!password}
              >
                Use
              </Button>
            </ButtonGroup>
          </div>
          {strength ? (
            <div className="space-y-1">
              <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${strengthPercent}%`,
                    background: strength.score >= 3 ? "#16a34a" : "#eab308",
                  }}
                />
              </div>
              <p className="text-xs text-muted-foreground">{strengthLabel}</p>
            </div>
          ) : null}
          <div className="space-y-2">
            <Slider
              minValue={1}
              maxValue={50}
              step={1}
              value={length}
              onChange={(v) => setLength(v as number)}
            >
              <Label>Length</Label>
              <Slider.Output />
              <Slider.Track className="bg-foreground/10">
                <Slider.Fill />
                <Slider.Thumb />
              </Slider.Track>
            </Slider>
          </div>
          <TagGroup
            selectedKeys={selectedSets}
            selectionMode="multiple"
            onSelectionChange={(keys) => {
              if (keys !== "all" && Array.from(keys).length === 0) return;
              setSelectedSets(keys);
            }}
          >
            <TagGroup.List>
              <Tag id="uppercase">Uppercase</Tag>
              <Tag id="lowercase">Lowercase</Tag>
              <Tag id="numbers">Numbers</Tag>
              <Tag id="symbols">Symbols</Tag>
            </TagGroup.List>
          </TagGroup>
        </div>
      </Disclosure.Content>
    </Disclosure>
  );
}
