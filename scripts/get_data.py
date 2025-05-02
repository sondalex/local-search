from argparse import ArgumentParser, BooleanOptionalAction
from enum import Enum
from typing import Optional

import pandas as pd
import pyarrow as pa
import pyarrow.parquet as pq
from datasets import load_dataset
from sentence_transformers import SentenceTransformer

COLUMN = "content"


def str_or_none(x: Optional[str]) -> Optional[str]:
    if x is None or x == "" or x == " ":
        return None
    return x


class Model(Enum):
    MINILM = "sentence-transformers/all-MiniLM-L6-v2"
    ARCTICEMBEDMEDIUM = "Snowflake/snowflake-arctic-embed-m-v2.0"
    ARCTICEMBEDLARGE = "Snowflake/snowflake-arctic-embed-l-v2.0"


def cli() -> ArgumentParser:
    parser = ArgumentParser()
    parser.add_argument(
        "--input",
        help="Path to input file. If not provided, an example dataset will be downloaded from HuggingFace.",
        required=False,
        default=None,
        type=str_or_none,
    )
    parser.add_argument("--output", help="Path to output file", required=True, type=str)
    parser.add_argument(
        "--model",
        help=f"Model to use for embeddings. Choose from {[m.name for m in Model]}",
        default=Model.MINILM.name,
        choices=[m.name for m in Model],
        type=str,
    )
    parser.add_argument(
        "--nrow",
        help="Number of rows to process (-1 or 0 for all)",
        default=-1,
        type=int,
    )
    parser.add_argument(
        "--trust-remote-code",
        help="Whether to set transformers parameter trust_remote_code to true. Defaults to False",
        action=BooleanOptionalAction,
    )
    return parser


def validate_data(df: pd.DataFrame) -> None:
    """
    Validate that the input DataFrame contains required columns and proper data types.

    Args:
        df: Input DataFrame to validate

    Raises:
        ValueError: If required columns are missing or data types are incorrect
    """
    required_columns = {"id", "content", "categories"}
    missing_columns = required_columns - set(df.columns)
    if missing_columns:
        raise ValueError(f"Missing required columns: {missing_columns}")

    # Check content column contains strings
    if not pd.api.types.is_string_dtype(df["content"]):
        raise ValueError("Content column must contain strings")

    # Check categories is list-like
    if not all(isinstance(x, (list, tuple)) for x in df["categories"]):
        raise ValueError("Categories column must contain lists")


def calculate_embeddings(
    column: pd.Series,
    model_name: str,
    trust_remote_code: bool = False,
    batch_size: int = 32,
) -> pd.Series:
    """
    Calculate embeddings for a series of text using the specified model.

    Args:
        column: Series containing text to embed
        model_name: Name of the model to use for embeddings

    Returns:
        Series containing embedding vectors
    """
    model = SentenceTransformer(model_name, trust_remote_code=trust_remote_code)
    embeddings = model.encode(column.tolist(), batch_size=batch_size)
    return pd.Series([vector for vector in embeddings], index=column.index)


def save_to_parquet(df: pd.DataFrame, output_path: str, embedding_dim: int) -> None:
    """
    Save a DataFrame to a Parquet file with a schema matching
    and a fixed-size embeddings column.

    Args:
        df: DataFrame containing ArxivPaper fields and embeddings
        output_path: Path to save the Parquet file
        embedding_dim: Dimension of the embeddings
    """
    schema = pa.schema(
        [
            ("id", pa.string()),
            ("submitter", pa.string()),
            ("authors", pa.string()),
            ("title", pa.string()),
            ("comments", pa.string()),
            ("journal-ref", pa.string()),
            ("doi", pa.string()),
            ("content", pa.string()),
            ("report-no", pa.string()),
            ("categories", pa.list_(pa.string())),
            ("versions", pa.list_(pa.string())),
            ("embedding", pa.list_(pa.float32(), embedding_dim)),
        ]
    )

    table = pa.Table.from_pandas(df, schema=schema)
    pq.write_table(table, output_path)


def _main(
    input_path: Optional[str],
    output_path: str,
    model: str,
    nrow: int,
    trust_remote_code: bool,
) -> None:
    if input_path is None:
        ds = load_dataset("gfissore/arxiv-abstracts-2021")
        da = ds["train"]
        if nrow > 0:
            da = da.select(range(min(nrow, len(da))))
        subset = da.to_pandas()
        categories = subset["categories"]
        categories = categories.apply(lambda x: [el.split(".")[0] for el in x])
        subset["categories"] = categories
        subset = subset.rename(columns={"abstract": "content"})
    else:
        subset = pd.read_parquet(input_path)
        if nrow > 0:
            subset = subset.iloc[:nrow]
        validate_data(subset)
    batch_size = 32
    if model == Model.ARCTICEMBEDLARGE.name:
        batch_size = 8

    subset["embedding"] = calculate_embeddings(
        subset[COLUMN], Model[model].value, trust_remote_code, batch_size
    )
    embedding_dim = len(subset["embedding"].iloc[0])
    save_to_parquet(subset, output_path, embedding_dim)


def main():
    parser = cli()
    args = parser.parse_args()
    _main(args.input, args.output, args.model, args.nrow, args.trust_remote_code)


if __name__ == "__main__":
    import sys

    sys.exit(main())
